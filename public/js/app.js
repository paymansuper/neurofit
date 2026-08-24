// ===== NeuroFit App: Router, Startseite, Statistik, Einstellungen =====
import {
  loadProfile, saveProfile, resetProfile,
  GAMES, CATEGORIES, AGE_GROUPS, eloToLevel, recommendedDifficulty, DIFFICULTIES, escapeHtml, xpToRank,
  ACHIEVEMENTS, currentDailyStreak,
} from './core.js';
import { gameShell } from './gameshell.js';
import { renderAdventureMap, playLevel } from './adventure.js';
import { playDaily, isDailyDone, todaysGames } from './daily.js';
import { RENDERERS } from './renderers.js';

let profile = loadProfile();
const app = document.getElementById('app');

function applyPrefs() {
  document.documentElement.dataset.theme = profile.theme;
  document.documentElement.dataset.textsize = profile.textSize;
}

function refreshStreakPill() {
  const pill = document.getElementById('streak-pill');
  if (!pill) return;
  const streak = currentDailyStreak(profile);
  pill.hidden = streak === 0;
  pill.textContent = `🔥 ${streak}`;
  pill.title = `${streak} Tage Tages-Challenge in Folge`;
}

// ===== Navigation =====
document.querySelectorAll('[data-nav]').forEach(b => {
  b.addEventListener('click', () => navigate(b.dataset.nav));
});

function navigate(view) {
  document.querySelectorAll('.topnav button').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === view));
  refreshStreakPill();
  if (view === 'home') renderHome();
  else if (view === 'adventure') renderAdventure();
  else if (view === 'stats') renderStats();
  else if (view === 'settings') renderSettings();
}

// ===== Abenteuer-Modus =====
function renderAdventure() {
  if (!profile.ageGroup) { renderOnboarding(); return; }
  renderAdventureMap(app, profile, (worldId, level) => {
    playLevel(app, profile, worldId, level, () => navigate('adventure'));
  });
}

// ===== Onboarding: Altersgruppe wählen (keine exakten Daten!) =====
function renderOnboarding() {
  app.innerHTML = `
    <div class="card onboard">
      <h1>🧠 Willkommen bei NeuroFit!</h1>
      <p style="color:var(--muted);margin-top:0.6rem">
        Dein kostenloses Gehirnjogging – ohne Anmeldung und ohne Datensammlung.
        Wähle deine Altersgruppe, damit wir passende Aufgaben empfehlen können.
        Diese Angabe bleibt nur auf deinem Gerät.
      </p>
      <div class="age-options">
        ${AGE_GROUPS.map(a => `
          <button class="btn secondary" data-age="${a.id}" style="flex-direction:column;padding:1rem">
            <span style="font-size:2rem">${a.emoji}</span>
            <span>${a.label}</span>
          </button>`).join('')}
      </div>
      <p style="font-size:0.8rem;color:var(--muted)">Du kannst die Altersgruppe jederzeit in den Einstellungen ändern.</p>
    </div>`;

  app.querySelectorAll('[data-age]').forEach(b => {
    b.addEventListener('click', () => {
      profile.ageGroup = b.dataset.age;
      saveProfile(profile);
      renderHome();
    });
  });
}

// ===== Startseite / Übungsauswahl =====
function renderHome() {
  if (!profile.ageGroup) { renderOnboarding(); return; }
  const ag = AGE_GROUPS.find(a => a.id === profile.ageGroup);

  const done = isDailyDone(profile);
  const streak = currentDailyStreak(profile);
  const dailyIcons = todaysGames().map(id => GAMES.find(g => g.id === id).icon).join(' ');

  app.innerHTML = `
    <div class="hero">
      <h1>Was möchtest du heute trainieren?</h1>
      <p>Altersgruppe: ${ag.emoji} ${ag.label} · ${profile.totalPlayed} Aufgaben trainiert · ${profile.playDays.length} Tage aktiv</p>
    </div>
    <button class="daily-banner ${done ? 'done' : ''}" id="go-daily">
      <span class="adv-banner-emoji">${done ? '✅' : '📅'}</span>
      <span>
        <strong>Tages-Challenge</strong> ${streak > 0 ? `<span class="streak-flame">🔥 ${streak}</span>` : ''}<br>
        <small>${done ? 'Heute geschafft – komm morgen wieder für deinen Streak!' : `Heute: ${dailyIcons} · 3 Aufgaben, 2 richtig = Streak & Bonus-XP!`}</small>
      </span>
      <span class="adv-banner-go">${done ? 'Erledigt ✓' : 'Los geht\'s →'}</span>
    </button>
    <button class="adv-banner" id="go-adventure">
      <span class="adv-banner-emoji">🗺️</span>
      <span>
        <strong>Abenteuer-Modus</strong><br>
        <small>Reise durch 5 Welten, besiege Boss-Level, sammle Sterne & steige im Rang auf!</small>
      </span>
      <span class="adv-banner-go">Spielen →</span>
    </button>
    ${CATEGORIES.map(cat => {
      const games = GAMES.filter(g => g.cat === cat.id);
      if (!games.length) return '';
      return `
      <h2 class="cat-heading">${cat.emoji} ${cat.name}</h2>
      <div class="game-grid">
        ${games.map(g => {
          const r = profile.ratings[g.id];
          const lvl = eloToLevel(r.elo);
          const rec = DIFFICULTIES.find(d => d.id === recommendedDifficulty(profile, g.id));
          return `
          <button class="game-card" data-game="${g.id}">
            <span class="icon">${g.icon}</span>
            <h3>${g.name}</h3>
            <p>${g.desc}</p>
            <span class="rating-badge">${lvl.emoji} ${lvl.name} · ${r.elo}</span>
            <span class="sub" style="color:var(--muted);font-size:0.78rem">Empfohlen: ${rec.label}</span>
          </button>`;
        }).join('')}
      </div>`;
    }).join('')}`;

  app.querySelectorAll('[data-game]').forEach(b => {
    b.addEventListener('click', () => openGame(b.dataset.game));
  });
  app.querySelector('#go-adventure').addEventListener('click', () => navigate('adventure'));
  app.querySelector('#go-daily').addEventListener('click', () => {
    playDaily(app, profile, () => navigate('home'));
  });
}

function openGame(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  gameShell(app, profile, game, RENDERERS[gameId], () => navigate('home'));
}

// ===== Statistik =====
function renderStats() {
  const totalSolved = Object.values(profile.ratings).reduce((a, r) => a + r.solved, 0);
  const avgElo = Math.round(Object.values(profile.ratings).reduce((a, r) => a + r.elo, 0) / GAMES.length);
  const overall = eloToLevel(avgElo);
  const rank = xpToRank(profile.adventure.xp);
  const totalStars = Object.values(profile.adventure.levels).reduce((a, b) => a + b, 0);

  app.innerHTML = `
    <div class="hero">
      <h1>📈 Meine Statistik</h1>
      <p>Gesamt-Skill: <strong>${avgElo}</strong> ${overall.emoji} ${overall.name} · ${totalSolved} richtig gelöst · ${profile.playDays.length} Tage aktiv</p>
      <p>Abenteuer: <strong>${rank.emoji} ${rank.name}</strong> · ${profile.adventure.xp} XP · ⭐ ${totalStars} Sterne</p>
    </div>
    <div class="stat-grid">
      ${GAMES.map(g => {
        const r = profile.ratings[g.id];
        const lvl = eloToLevel(r.elo);
        const quote = r.played ? Math.round((r.solved / r.played) * 100) : 0;
        const pct = Math.min(100, Math.max(0, ((r.elo - 300) / 1700) * 100));
        return `
        <div class="card stat-card">
          <h3>${g.icon} ${g.name}</h3>
          <div class="big">${r.elo}</div>
          <div class="level-tag">${lvl.emoji} ${lvl.name}</div>
          <div class="progress-bar"><div style="width:${pct}%"></div></div>
          <p class="sub">${r.played} gespielt · ${quote} % Erfolgsquote · Beste Serie: ${r.bestStreak} 🔥</p>
        </div>`;
      }).join('')}
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>🎖️ Abzeichen (${Object.keys(profile.achievements).length}/${ACHIEVEMENTS.length})</h3>
      <div class="badge-grid">
        ${ACHIEVEMENTS.map(a => {
          const got = !!profile.achievements[a.id];
          return `
          <div class="badge-card ${got ? 'unlocked' : ''}" title="${escapeHtml(a.desc)}">
            <span class="badge-emoji">${got ? a.emoji : '🔒'}</span>
            <strong>${a.name}</strong>
            <small>${a.desc}</small>
            ${got ? `<small class="badge-date">✓ ${new Date(profile.achievements[a.id]).toLocaleDateString('de-DE')}</small>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>💡 Trainings-Tipp</h3>
      <p style="color:var(--muted)">${trainingTip()}</p>
    </div>`;
}

function trainingTip() {
  const weakest = GAMES.reduce((min, g) =>
    profile.ratings[g.id].elo < profile.ratings[min.id].elo ? g : min, GAMES[0]);
  const strongest = GAMES.reduce((max, g) =>
    profile.ratings[g.id].elo > profile.ratings[max.id].elo ? g : max, GAMES[0]);
  if (profile.totalPlayed < 5) {
    return 'Probiere jede Übung mindestens einmal aus – so findet NeuroFit heraus, wo du stehst und was zu dir passt.';
  }
  return `Dein stärkster Bereich ist ${strongest.icon} ${strongest.name} – stark! ` +
    `Für ein ausgewogenes Training empfehlen wir dir gerade ${weakest.icon} ${weakest.name}. ` +
    `Schon 10 Minuten tägliches Üben in wechselnden Kategorien hält das Gehirn nachweislich fit.`;
}

// ===== Einstellungen =====
function renderSettings() {
  app.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:0.8rem">⚙️ Einstellungen</h2>
      <div class="settings-row">
        <div><strong>Altersgruppe</strong><br><small style="color:var(--muted)">Für Aufgaben-Empfehlungen – bleibt auf deinem Gerät</small></div>
        <select id="set-age">
          ${AGE_GROUPS.map(a => `<option value="${a.id}" ${profile.ageGroup === a.id ? 'selected' : ''}>${a.emoji} ${a.label}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <div><strong>Darstellung</strong></div>
        <select id="set-theme">
          <option value="light" ${profile.theme === 'light' ? 'selected' : ''}>☀️ Hell</option>
          <option value="dark" ${profile.theme === 'dark' ? 'selected' : ''}>🌙 Dunkel</option>
        </select>
      </div>
      <div class="settings-row">
        <div><strong>Textgröße</strong><br><small style="color:var(--muted)">Größere Schrift für bessere Lesbarkeit</small></div>
        <select id="set-textsize">
          <option value="normal" ${profile.textSize === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="gross" ${profile.textSize === 'gross' ? 'selected' : ''}>Groß</option>
          <option value="sehr-gross" ${profile.textSize === 'sehr-gross' ? 'selected' : ''}>Sehr groß</option>
        </select>
      </div>
      <div class="settings-row">
        <div><strong>Fortschritt zurücksetzen</strong><br><small style="color:var(--muted)">Löscht alle Statistiken und Einstellungen unwiderruflich</small></div>
        <button class="btn danger" id="btn-reset">Alles löschen</button>
      </div>
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>🔒 Datenschutz</h3>
      <p style="color:var(--muted)">NeuroFit speichert keinerlei personenbezogene Daten. Deine Altersgruppe,
      Einstellungen und Spielstatistiken liegen ausschließlich im lokalen Speicher deines Browsers
      und verlassen dein Gerät niemals. Es gibt kein Tracking, keine Cookies von Drittanbietern und keine Server-Datenbank.</p>
    </div>`;

  app.querySelector('#set-age').addEventListener('change', e => {
    profile.ageGroup = e.target.value; saveProfile(profile);
  });
  app.querySelector('#set-theme').addEventListener('change', e => {
    profile.theme = e.target.value; saveProfile(profile); applyPrefs();
  });
  app.querySelector('#set-textsize').addEventListener('change', e => {
    profile.textSize = e.target.value; saveProfile(profile); applyPrefs();
  });
  app.querySelector('#btn-reset').addEventListener('click', () => {
    if (confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.')) {
      resetProfile();
      profile = loadProfile();
      applyPrefs();
      renderOnboarding();
    }
  });
}

// ===== Start =====
applyPrefs();
navigate('home');

// PWA: Service Worker registrieren (offline-fähig & installierbar)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline-Modus optional */ });
}
