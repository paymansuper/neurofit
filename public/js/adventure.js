// ===== Abenteuer-Modus: Weltkarte, Level, XP, Ränge & Charaktere =====
// Wie ein Jump'n'Run: Dein Charakter reist durch 5 Welten, sammelt Sterne
// und XP, besiegt Boss-Level (Sudoku!) und schaltet Ränge & Helden frei.
import { saveProfile, xpToRank, RANKS, CHARACTERS, pick, escapeHtml, checkAchievements } from './core.js';
import { confetti, celebrateAchievements } from './effects.js';
import { RENDERERS } from './renderers.js';

export const WORLDS = [
  { id: 0, name: 'Zahlenwiese',   emoji: '🌼', difficulty: 'sehr-leicht', games: ['rechnen', 'logik', 'merken', 'waage', 'memory'],  boss: 'sudoku', story: 'Auf der sonnigen Zahlenwiese beginnt deine Reise. Sammle deine ersten Sterne!' },
  { id: 1, name: 'Wörterwald',    emoji: '🌲', difficulty: 'leicht',      games: ['worte', 'text', 'merken', 'wortgitter', 'memory'], boss: 'sudoku', story: 'Im geheimnisvollen Wörterwald verstecken sich Buchstaben zwischen den Bäumen.' },
  { id: 2, name: 'Logik-Gebirge', emoji: '⛰️', difficulty: 'mittel',      games: ['logik', 'rechnen', 'tabellen', 'waage', 'stroop'], boss: 'sudoku', story: 'Steile Pfade, knifflige Muster – nur wer logisch denkt, erklimmt den Gipfel.' },
  { id: 3, name: 'Datensee',      emoji: '🌊', difficulty: 'schwer',      games: ['tabellen', 'rechnen', 'text', 'logik', 'stroop', 'memory'], boss: 'sudoku', story: 'Tauche in die Tiefen des Datensees – hier zählen kühler Kopf und Übersicht.' },
  { id: 4, name: 'Neuro-Vulkan',  emoji: '🌋', difficulty: 'experte',     games: ['rechnen', 'logik', 'merken', 'worte', 'tabellen', 'text', 'stroop', 'waage', 'wortgitter', 'memory'], boss: 'sudoku', story: 'Das finale Abenteuer: Im brodelnden Neuro-Vulkan warten die härtesten Prüfungen!' },
];

const LEVELS_PER_WORLD = 6; // 5 normale + 1 Boss
const TASKS_PER_LEVEL = 4;
const XP_PER_TASK = { 'sehr-leicht': 10, 'leicht': 15, 'mittel': 20, 'schwer': 30, 'experte': 40 };
const BOSS_MULTIPLIER = 5;
const PERFECT_BONUS = 20;

function levelKey(worldId, level) { return `${worldId}-${level}`; }

export function getStars(profile, worldId, level) {
  return profile.adventure.levels[levelKey(worldId, level)] || 0;
}

function isLevelUnlocked(profile, worldId, level) {
  if (worldId === 0 && level === 1) return true;
  if (level === 1) return getStars(profile, worldId - 1, LEVELS_PER_WORLD) > 0; // Boss der Vorwelt besiegt
  return getStars(profile, worldId, level - 1) > 0;
}

function isWorldUnlocked(profile, worldId) {
  return isLevelUnlocked(profile, worldId, 1);
}

export function currentCharacter(profile) {
  return CHARACTERS.find(c => c.id === profile.adventure.character) || CHARACTERS[0];
}

function starsHtml(n) {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

// ===== Weltkarte =====
export function renderAdventureMap(root, profile, onPlayLevel) {
  const adv = profile.adventure;
  const rank = xpToRank(adv.xp);
  const char = currentCharacter(profile);
  const totalStars = Object.values(adv.levels).reduce((a, b) => a + b, 0);

  // Position des Charakters: erstes freigeschaltetes, noch nicht gemeistertes Level
  let charPos = null;
  outer: for (const w of WORLDS) {
    for (let l = 1; l <= LEVELS_PER_WORLD; l++) {
      if (isLevelUnlocked(profile, w.id, l) && getStars(profile, w.id, l) === 0) {
        charPos = levelKey(w.id, l);
        break outer;
      }
    }
  }

  root.innerHTML = `
    <div class="adv-header card">
      <div class="adv-hero">
        <span class="adv-char" title="${escapeHtml(char.name)}">${char.emoji}</span>
        <div>
          <h2>${escapeHtml(char.name)}s Abenteuer</h2>
          <p class="sub">Rang: <strong>${rank.emoji} ${rank.name}</strong> · ${adv.xp} XP · ⭐ ${totalStars}/${WORLDS.length * LEVELS_PER_WORLD * 3} Sterne</p>
          <div class="progress-bar rank-bar"><div style="width:${Math.round(rank.progress * 100)}%"></div></div>
          <p class="sub">${rank.next ? `Noch ${rank.next.xp - adv.xp} XP bis ${rank.next.emoji} ${rank.next.name}` : 'Höchster Rang erreicht – legendär! 👑'}</p>
        </div>
        <button class="btn secondary" id="btn-chars">🎭 Charakter</button>
      </div>
    </div>
    <div id="char-select"></div>
    ${WORLDS.map(w => {
      const unlocked = isWorldUnlocked(profile, w.id);
      const worldStars = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => getStars(profile, w.id, i + 1)).reduce((a, b) => a + b, 0);
      return `
      <section class="world-card card ${unlocked ? '' : 'locked'}">
        <div class="world-title">
          <h3>${w.emoji} Welt ${w.id + 1}: ${w.name}</h3>
          <span class="pill">⭐ ${worldStars}/${LEVELS_PER_WORLD * 3}</span>
        </div>
        <p class="world-story">${unlocked ? w.story : '🔒 Besiege den Boss der vorherigen Welt, um diese Welt freizuschalten!'}</p>
        <div class="level-path">
          ${Array.from({ length: LEVELS_PER_WORLD }, (_, i) => {
            const lv = i + 1;
            const isBoss = lv === LEVELS_PER_WORLD;
            const lvUnlocked = isLevelUnlocked(profile, w.id, lv);
            const stars = getStars(profile, w.id, lv);
            const here = charPos === levelKey(w.id, lv);
            return `
            <button class="level-node ${lvUnlocked ? '' : 'locked'} ${isBoss ? 'boss' : ''} ${stars > 0 ? 'done' : ''}"
                    data-world="${w.id}" data-level="${lv}" ${lvUnlocked ? '' : 'disabled'}
                    aria-label="Level ${lv}${isBoss ? ' (Boss)' : ''}">
              <span class="node-face">${here ? char.emoji : (lvUnlocked ? (isBoss ? '🏰' : lv) : '🔒')}</span>
              <span class="node-stars">${stars > 0 ? starsHtml(stars) : (isBoss ? 'BOSS' : '')}</span>
            </button>
            ${lv < LEVELS_PER_WORLD ? '<span class="path-dash">···</span>' : ''}`;
          }).join('')}
        </div>
      </section>`;
    }).join('')}`;

  root.querySelectorAll('.level-node:not(.locked)').forEach(b => {
    b.addEventListener('click', () => onPlayLevel(Number(b.dataset.world), Number(b.dataset.level)));
  });

  root.querySelector('#btn-chars').addEventListener('click', () => renderCharacterSelect(root.querySelector('#char-select'), profile, () => renderAdventureMap(root, profile, onPlayLevel)));
}

function renderCharacterSelect(slot, profile, rerender) {
  const rank = xpToRank(profile.adventure.xp);
  slot.innerHTML = `
    <div class="card" style="margin-bottom:1rem">
      <h3>🎭 Wähle deinen Helden</h3>
      <div class="char-grid">
        ${CHARACTERS.map(c => {
          const unlocked = rank.index >= c.unlockRank;
          const active = profile.adventure.character === c.id;
          return `
          <button class="char-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-char="${c.id}" ${unlocked ? '' : 'disabled'}>
            <span class="char-emoji">${unlocked ? c.emoji : '🔒'}</span>
            <span>${c.name}</span>
            <small>${unlocked ? (active ? 'Ausgewählt ✓' : 'Verfügbar') : `Ab Rang: ${RANKS[c.unlockRank].emoji} ${RANKS[c.unlockRank].name}`}</small>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  slot.querySelectorAll('.char-card:not(.locked)').forEach(b => {
    b.addEventListener('click', () => {
      profile.adventure.character = b.dataset.char;
      saveProfile(profile);
      rerender();
    });
  });
}

// ===== Level spielen =====
export function playLevel(root, profile, worldId, level, onExit) {
  const world = WORLDS[worldId];
  const isBoss = level === LEVELS_PER_WORLD;
  const char = currentCharacter(profile);
  const tasks = isBoss
    ? [world.boss]
    : Array.from({ length: TASKS_PER_LEVEL }, () => pick(world.games));

  let taskIndex = 0;
  let correct = 0;
  let solutionUsedCount = 0;
  const rankBefore = xpToRank(profile.adventure.xp);

  function renderTaskScreen() {
    const gameId = tasks[taskIndex];
    root.innerHTML = `
      <div class="card">
        <div class="game-header">
          <h2>${char.emoji} ${world.emoji} Welt ${worldId + 1} – ${isBoss ? '🏰 BOSS-LEVEL' : `Level ${level}`}</h2>
          <span class="pill">Aufgabe ${taskIndex + 1}/${tasks.length} · ✅ ${correct}</span>
        </div>
        <div class="adv-progress progress-bar"><div style="width:${(taskIndex / tasks.length) * 100}%"></div></div>
        <div id="task-area" style="margin-top:1rem"></div>
        <div class="btn-row">
          <button class="btn secondary" id="btn-solution">💡 Lösung zeigen</button>
          <button class="btn ghost" id="btn-quit">✖ Level abbrechen</button>
        </div>
        <div id="continue-slot"></div>
      </div>`;

    let finished = false;
    let taskWon = false;
    const api = {
      difficulty: world.difficulty,
      isFinished: () => finished,
      markSolutionUsed() { solutionUsedCount++; },
      finish(won) {
        if (finished) return;
        finished = true;
        taskWon = won;
        if (won) correct++;
        showContinue(won);
      },
    };

    const taskArea = root.querySelector('#task-area');
    const ctrl = RENDERERS[gameId](taskArea, world.difficulty, api) || {};

    root.querySelector('#btn-solution').addEventListener('click', () => {
      if (finished) return;
      solutionUsedCount++;
      if (ctrl.showSolution) ctrl.showSolution();
      api.finish(false);
    });
    root.querySelector('#btn-quit').addEventListener('click', onExit);

    function showContinue(won) {
      const slot = root.querySelector('#continue-slot');
      const last = taskIndex === tasks.length - 1;
      slot.innerHTML = `
        <div class="round-result">
          <p class="delta ${won ? 'up' : 'down'}">${won ? pick(['💪 Stark!', '🎯 Volltreffer!', '⚡ Weiter so!', '🌟 Klasse!']) : pick(['Kopf hoch – weiter geht\'s!', 'Beim nächsten Mal klappt\'s!'])}</p>
          <button class="btn" id="btn-continue">${last ? '🏁 Level abschließen' : 'Weiter →'}</button>
        </div>`;
      slot.querySelector('#btn-continue').addEventListener('click', () => {
        taskIndex++;
        if (taskIndex >= tasks.length) finishLevel();
        else renderTaskScreen();
      });
    }
  }

  function finishLevel() {
    // Sterne: 3 = alles richtig, 2 = ≥ 75 %, 1 = ≥ 50 %, 0 = nicht geschafft
    const ratio = correct / tasks.length;
    let stars = 0;
    if (ratio === 1) stars = 3;
    else if (ratio >= 0.75) stars = 2;
    else if (ratio >= 0.5) stars = 1;

    // XP berechnen
    const per = XP_PER_TASK[world.difficulty];
    let xp = correct * per * (isBoss ? BOSS_MULTIPLIER : 1);
    if (stars === 3) xp += PERFECT_BONUS;

    const key = levelKey(worldId, level);
    const prevStars = profile.adventure.levels[key] || 0;
    if (stars > prevStars) profile.adventure.levels[key] = stars;
    profile.adventure.xp += xp;
    saveProfile(profile);

    const rankAfter = xpToRank(profile.adventure.xp);
    const rankUp = rankAfter.index > rankBefore.index;
    const newChars = CHARACTERS.filter(c => c.unlockRank > rankBefore.index && c.unlockRank <= rankAfter.index);
    const bossBeaten = isBoss && stars > 0;
    const unlocked = checkAchievements(profile);

    root.innerHTML = `
      <div class="card round-result adv-finish">
        <div class="adv-char" style="font-size:4rem">${stars > 0 ? char.emoji : '😅'}</div>
        <h2>${stars > 0 ? (bossBeaten ? '🏰 Boss besiegt!' : 'Level geschafft!') : 'Fast geschafft!'}</h2>
        <p class="adv-stars ${stars > 0 ? 'won' : ''}">${starsHtml(stars)}</p>
        <p>${correct}/${tasks.length} Aufgaben richtig · <strong>+${xp} XP</strong></p>
        ${rankUp ? `<div class="solution-box rankup"><h4>🎉 RANG-AUFSTIEG!</h4><p>Du bist jetzt <strong>${rankAfter.emoji} ${rankAfter.name}</strong>!</p></div>` : ''}
        ${newChars.map(c => `<div class="solution-box rankup"><h4>🎭 Neuer Held freigeschaltet!</h4><p><span style="font-size:2rem">${c.emoji}</span> <strong>${c.name}</strong> wartet auf dich!</p></div>`).join('')}
        ${bossBeaten && worldId < WORLDS.length - 1 ? `<div class="solution-box rankup"><h4>🗺️ Neue Welt entdeckt!</h4><p>${WORLDS[worldId + 1].emoji} <strong>${WORLDS[worldId + 1].name}</strong> ist jetzt freigeschaltet!</p></div>` : ''}
        ${stars === 0 ? '<p class="sub">Du brauchst mindestens die Hälfte richtig, um das Level zu bestehen. Versuch es gleich nochmal – du schaffst das!</p>' : ''}
        <div class="btn-row" style="justify-content:center">
          ${stars < 3 ? '<button class="btn secondary" id="btn-retry">🔄 Nochmal versuchen</button>' : ''}
          <button class="btn" id="btn-map">🗺️ Zur Weltkarte</button>
        </div>
      </div>`;

    const retry = root.querySelector('#btn-retry');
    if (retry) retry.addEventListener('click', () => playLevel(root, profile, worldId, level, onExit));
    root.querySelector('#btn-map').addEventListener('click', onExit);

    if (stars === 3 || bossBeaten || rankUp) confetti();
    celebrateAchievements(unlocked);
  }

  renderTaskScreen();
}
