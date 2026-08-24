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
import { t, L, getLang, setLang } from './i18n.js';

let profile = loadProfile();
const app = document.getElementById('app');

function applyPrefs() {
  document.documentElement.dataset.theme = profile.theme;
  document.documentElement.dataset.textsize = profile.textSize;
}

// Statische Seitenelemente (Nav, Footer, Titel) übersetzen
function applyLangToChrome() {
  document.documentElement.lang = getLang();
  document.title = t('app.title');
  const navLabels = { home: 'nav.exercises', adventure: 'nav.adventure', stats: 'nav.stats', settings: 'nav.settings' };
  document.querySelectorAll('.topnav button').forEach(b => { b.textContent = t(navLabels[b.dataset.nav]); });
  const brand = document.querySelector('.brand');
  if (brand) brand.setAttribute('aria-label', t('nav.home'));
  const footer = document.querySelector('.footer p');
  if (footer) footer.textContent = t('footer');
}

function refreshStreakPill() {
  const pill = document.getElementById('streak-pill');
  if (!pill) return;
  const streak = currentDailyStreak(profile);
  pill.hidden = streak === 0;
  pill.textContent = `🔥 ${streak}`;
  pill.title = t('streak.title', { n: streak });
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

// ===== Onboarding: Sprache & Altersgruppe wählen (keine exakten Daten!) =====
function renderOnboarding() {
  app.innerHTML = `
    <div class="card onboard">
      <h1>${t('onboard.title')}</h1>
      <div class="lang-switch" style="display:flex;gap:0.6rem;justify-content:center;margin-top:0.8rem">
        <button class="btn ${getLang() === 'de' ? '' : 'secondary'}" data-lang="de">🇩🇪 Deutsch</button>
        <button class="btn ${getLang() === 'en' ? '' : 'secondary'}" data-lang="en">🇬🇧 English</button>
      </div>
      <p style="color:var(--muted);margin-top:0.6rem">${t('onboard.text')}</p>
      <div class="age-options">
        ${AGE_GROUPS.map(a => `
          <button class="btn secondary" data-age="${a.id}" style="flex-direction:column;padding:1rem">
            <span style="font-size:2rem">${a.emoji}</span>
            <span>${L(a.label)}</span>
          </button>`).join('')}
      </div>
      <p style="font-size:0.8rem;color:var(--muted)">${t('onboard.hint')}</p>
    </div>`;

  app.querySelectorAll('[data-lang]').forEach(b => {
    b.addEventListener('click', () => { if (b.dataset.lang !== getLang()) setLang(b.dataset.lang); });
  });
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
      <h1>${t('home.title')}</h1>
      <p>${t('home.meta', { ag: `${ag.emoji} ${L(ag.label)}`, n: profile.totalPlayed, d: profile.playDays.length })}</p>
    </div>
    <button class="daily-banner ${done ? 'done' : ''}" id="go-daily">
      <span class="adv-banner-emoji">${done ? '✅' : '📅'}</span>
      <span>
        <strong>${t('home.daily.title')}</strong> ${streak > 0 ? `<span class="streak-flame">🔥 ${streak}</span>` : ''}<br>
        <small>${done ? t('home.daily.done') : t('home.daily.todo', { icons: dailyIcons })}</small>
      </span>
      <span class="adv-banner-go">${done ? t('home.daily.goDone') : t('home.daily.go')}</span>
    </button>
    <button class="adv-banner" id="go-adventure">
      <span class="adv-banner-emoji">🗺️</span>
      <span>
        <strong>${t('home.adv.title')}</strong><br>
        <small>${t('home.adv.sub')}</small>
      </span>
      <span class="adv-banner-go">${t('home.adv.go')}</span>
    </button>
    ${CATEGORIES.map(cat => {
      const games = GAMES.filter(g => g.cat === cat.id);
      if (!games.length) return '';
      return `
      <h2 class="cat-heading">${cat.emoji} ${L(cat.name)}</h2>
      <div class="game-grid">
        ${games.map(g => {
          const r = profile.ratings[g.id];
          const lvl = eloToLevel(r.elo);
          const rec = DIFFICULTIES.find(d => d.id === recommendedDifficulty(profile, g.id));
          return `
          <button class="game-card" data-game="${g.id}">
            <span class="icon">${g.icon}</span>
            <h3>${L(g.name)}</h3>
            <p>${L(g.desc)}</p>
            <span class="rating-badge">${lvl.emoji} ${L(lvl.name)} · ${r.elo}</span>
            <span class="sub" style="color:var(--muted);font-size:0.78rem">${t('home.recommended', { d: L(rec.label) })}</span>
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
      <h1>${t('stats.title')}</h1>
      <p>${t('stats.meta1', { elo: avgElo, lvl: `${overall.emoji} ${L(overall.name)}`, n: totalSolved, d: profile.playDays.length })}</p>
      <p>${t('stats.meta2', { rank: `${rank.emoji} ${L(rank.name)}`, xp: profile.adventure.xp, stars: totalStars })}</p>
    </div>
    <div class="stat-grid">
      ${GAMES.map(g => {
        const r = profile.ratings[g.id];
        const lvl = eloToLevel(r.elo);
        const quote = r.played ? Math.round((r.solved / r.played) * 100) : 0;
        const pct = Math.min(100, Math.max(0, ((r.elo - 300) / 1700) * 100));
        return `
        <div class="card stat-card">
          <h3>${g.icon} ${L(g.name)}</h3>
          <div class="big">${r.elo}</div>
          <div class="level-tag">${lvl.emoji} ${L(lvl.name)}</div>
          <div class="progress-bar"><div style="width:${pct}%"></div></div>
          <p class="sub">${t('stats.perGame', { n: r.played, q: quote, s: r.bestStreak })}</p>
        </div>`;
      }).join('')}
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>${t('stats.badges')} (${Object.keys(profile.achievements).length}/${ACHIEVEMENTS.length})</h3>
      <div class="badge-grid">
        ${ACHIEVEMENTS.map(a => {
          const got = !!profile.achievements[a.id];
          return `
          <div class="badge-card ${got ? 'unlocked' : ''}" title="${escapeHtml(L(a.desc))}">
            <span class="badge-emoji">${got ? a.emoji : '🔒'}</span>
            <strong>${L(a.name)}</strong>
            <small>${L(a.desc)}</small>
            ${got ? `<small class="badge-date">✓ ${new Date(profile.achievements[a.id]).toLocaleDateString(getLang() === 'de' ? 'de-DE' : 'en-GB')}</small>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>${t('stats.tip')}</h3>
      <p style="color:var(--muted)">${trainingTip()}</p>
    </div>`;
}

function trainingTip() {
  const weakest = GAMES.reduce((min, g) =>
    profile.ratings[g.id].elo < profile.ratings[min.id].elo ? g : min, GAMES[0]);
  const strongest = GAMES.reduce((max, g) =>
    profile.ratings[g.id].elo > profile.ratings[max.id].elo ? g : max, GAMES[0]);
  if (profile.totalPlayed < 5) {
    return t('stats.tipNew');
  }
  return t('stats.tipText', {
    strong: `${strongest.icon} ${L(strongest.name)}`,
    weak: `${weakest.icon} ${L(weakest.name)}`,
  });
}

// ===== Einstellungen =====
function renderSettings() {
  app.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:0.8rem">${t('settings.title')}</h2>
      <div class="settings-row">
        <div><strong>${t('settings.language')}</strong><br><small style="color:var(--muted)">${t('settings.languageSub')}</small></div>
        <select id="set-lang">
          <option value="de" ${getLang() === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
          <option value="en" ${getLang() === 'en' ? 'selected' : ''}>🇬🇧 English</option>
        </select>
      </div>
      <div class="settings-row">
        <div><strong>${t('settings.age')}</strong><br><small style="color:var(--muted)">${t('settings.ageSub')}</small></div>
        <select id="set-age">
          ${AGE_GROUPS.map(a => `<option value="${a.id}" ${profile.ageGroup === a.id ? 'selected' : ''}>${a.emoji} ${L(a.label)}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <div><strong>${t('settings.display')}</strong></div>
        <select id="set-theme">
          <option value="light" ${profile.theme === 'light' ? 'selected' : ''}>${t('settings.light')}</option>
          <option value="dark" ${profile.theme === 'dark' ? 'selected' : ''}>${t('settings.dark')}</option>
        </select>
      </div>
      <div class="settings-row">
        <div><strong>${t('settings.textsize')}</strong><br><small style="color:var(--muted)">${t('settings.textsizeSub')}</small></div>
        <select id="set-textsize">
          <option value="normal" ${profile.textSize === 'normal' ? 'selected' : ''}>${t('settings.normal')}</option>
          <option value="gross" ${profile.textSize === 'gross' ? 'selected' : ''}>${t('settings.large')}</option>
          <option value="sehr-gross" ${profile.textSize === 'sehr-gross' ? 'selected' : ''}>${t('settings.xlarge')}</option>
        </select>
      </div>
      <div class="settings-row">
        <div><strong>${t('settings.reset')}</strong><br><small style="color:var(--muted)">${t('settings.resetSub')}</small></div>
        <button class="btn danger" id="btn-reset">${t('settings.resetBtn')}</button>
      </div>
    </div>
    <div class="card" style="margin-top:1.2rem">
      <h3>${t('settings.privacy')}</h3>
      <p style="color:var(--muted)">${t('settings.privacyText')}</p>
    </div>`;

  app.querySelector('#set-lang').addEventListener('change', e => {
    setLang(e.target.value);
  });
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
    if (confirm(t('settings.resetConfirm'))) {
      resetProfile();
      profile = loadProfile();
      applyPrefs();
      renderOnboarding();
    }
  });
}

// ===== Start =====
applyPrefs();
applyLangToChrome();
navigate('home');

// PWA: Service Worker registrieren (offline-fähig & installierbar)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline-Modus optional */ });
}
