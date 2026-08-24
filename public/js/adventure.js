// ===== Abenteuer-Modus: Weltkarte, Level, XP, Ränge & Charaktere =====
// Wie ein Jump'n'Run: Dein Charakter reist durch 5 Welten, sammelt Sterne
// und XP, besiegt Boss-Level (Sudoku!) und schaltet Ränge & Helden frei.
import { saveProfile, xpToRank, RANKS, CHARACTERS, pick, escapeHtml, checkAchievements } from './core.js';
import { confetti, celebrateAchievements } from './effects.js';
import { RENDERERS } from './renderers.js';
import { t, L } from './i18n.js';

export const WORLDS = [
  { id: 0, name: { de: 'Zahlenwiese', en: 'Number Meadow' }, emoji: '🌼', difficulty: 'sehr-leicht', games: ['rechnen', 'logik', 'merken', 'waage', 'memory'], boss: 'sudoku',
    story: { de: 'Auf der sonnigen Zahlenwiese beginnt deine Reise. Sammle deine ersten Sterne!', en: 'Your journey begins on the sunny Number Meadow. Collect your first stars!' } },
  { id: 1, name: { de: 'Wörterwald', en: 'Word Forest' }, emoji: '🌲', difficulty: 'leicht', games: ['worte', 'text', 'merken', 'wortgitter', 'memory'], boss: 'sudoku',
    story: { de: 'Im geheimnisvollen Wörterwald verstecken sich Buchstaben zwischen den Bäumen.', en: 'In the mysterious Word Forest, letters hide between the trees.' } },
  { id: 2, name: { de: 'Logik-Gebirge', en: 'Logic Mountains' }, emoji: '⛰️', difficulty: 'mittel', games: ['logik', 'rechnen', 'tabellen', 'waage', 'stroop'], boss: 'sudoku',
    story: { de: 'Steile Pfade, knifflige Muster – nur wer logisch denkt, erklimmt den Gipfel.', en: 'Steep paths, tricky patterns – only logical thinkers reach the summit.' } },
  { id: 3, name: { de: 'Datensee', en: 'Data Lake' }, emoji: '🌊', difficulty: 'schwer', games: ['tabellen', 'rechnen', 'text', 'logik', 'stroop', 'memory'], boss: 'sudoku',
    story: { de: 'Tauche in die Tiefen des Datensees – hier zählen kühler Kopf und Übersicht.', en: 'Dive into the depths of the Data Lake – a cool head and overview count here.' } },
  { id: 4, name: { de: 'Neuro-Vulkan', en: 'Neuro Volcano' }, emoji: '🌋', difficulty: 'experte', games: ['rechnen', 'logik', 'merken', 'worte', 'tabellen', 'text', 'stroop', 'waage', 'wortgitter', 'memory'], boss: 'sudoku',
    story: { de: 'Das finale Abenteuer: Im brodelnden Neuro-Vulkan warten die härtesten Prüfungen!', en: 'The final adventure: the toughest trials await in the bubbling Neuro Volcano!' } },
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
        <span class="adv-char" title="${escapeHtml(L(char.name))}">${char.emoji}</span>
        <div>
          <h2>${t('adv.title', { name: escapeHtml(L(char.name)) })}</h2>
          <p class="sub">${t('adv.rank')} <strong>${rank.emoji} ${L(rank.name)}</strong> · ${adv.xp} XP · ⭐ ${totalStars}/${WORLDS.length * LEVELS_PER_WORLD * 3} ${t('adv.stars')}</p>
          <div class="progress-bar rank-bar"><div style="width:${Math.round(rank.progress * 100)}%"></div></div>
          <p class="sub">${rank.next ? t('adv.xpTo', { xp: rank.next.xp - adv.xp, rank: `${rank.next.emoji} ${L(rank.next.name)}` }) : t('adv.maxRank')}</p>
        </div>
        <button class="btn secondary" id="btn-chars">${t('adv.charsBtn')}</button>
      </div>
    </div>
    <div id="char-select"></div>
    ${WORLDS.map(w => {
      const unlocked = isWorldUnlocked(profile, w.id);
      const worldStars = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => getStars(profile, w.id, i + 1)).reduce((a, b) => a + b, 0);
      return `
      <section class="world-card card ${unlocked ? '' : 'locked'}">
        <div class="world-title">
          <h3>${w.emoji} ${t('adv.world', { n: w.id + 1 })}: ${L(w.name)}</h3>
          <span class="pill">⭐ ${worldStars}/${LEVELS_PER_WORLD * 3}</span>
        </div>
        <p class="world-story">${unlocked ? L(w.story) : t('adv.lockedWorld')}</p>
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
                    aria-label="${t('adv.levelAria', { n: lv })}${isBoss ? t('adv.bossAria') : ''}">
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
      <h3>${t('adv.chooseHero')}</h3>
      <div class="char-grid">
        ${CHARACTERS.map(c => {
          const unlocked = rank.index >= c.unlockRank;
          const active = profile.adventure.character === c.id;
          return `
          <button class="char-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-char="${c.id}" ${unlocked ? '' : 'disabled'}>
            <span class="char-emoji">${unlocked ? c.emoji : '🔒'}</span>
            <span>${L(c.name)}</span>
            <small>${unlocked ? (active ? t('adv.selected') : t('adv.available')) : t('adv.fromRank', { rank: `${RANKS[c.unlockRank].emoji} ${L(RANKS[c.unlockRank].name)}` })}</small>
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
          <h2>${char.emoji} ${world.emoji} ${t('adv.world', { n: worldId + 1 })} – ${isBoss ? t('adv.bossLevel') : t('adv.level', { n: level })}</h2>
          <span class="pill">${t('adv.taskOf', { i: taskIndex + 1, n: tasks.length })} · ✅ ${correct}</span>
        </div>
        <div class="adv-progress progress-bar"><div style="width:${(taskIndex / tasks.length) * 100}%"></div></div>
        <div id="task-area" style="margin-top:1rem"></div>
        <div class="btn-row">
          <button class="btn secondary" id="btn-solution">${t('shell.showSolution')}</button>
          <button class="btn ghost" id="btn-quit">${t('adv.quit')}</button>
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
          <p class="delta ${won ? 'up' : 'down'}">${won ? pick([t('adv.praise1'), t('adv.praise2'), t('adv.praise3'), t('adv.praise4')]) : pick([t('adv.consol1'), t('adv.consol2')])}</p>
          <button class="btn" id="btn-continue">${last ? t('adv.finishLevel') : t('adv.continue')}</button>
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
        <h2>${stars > 0 ? (bossBeaten ? t('adv.bossBeaten') : t('adv.levelDone')) : t('adv.almost')}</h2>
        <p class="adv-stars ${stars > 0 ? 'won' : ''}">${starsHtml(stars)}</p>
        <p>${t('adv.tasksRight', { c: correct, n: tasks.length })} · <strong>+${xp} XP</strong></p>
        ${rankUp ? `<div class="solution-box rankup"><h4>${t('adv.rankUp')}</h4><p>${t('adv.youAreNow', { rank: `${rankAfter.emoji} ${L(rankAfter.name)}` })}</p></div>` : ''}
        ${newChars.map(c => `<div class="solution-box rankup"><h4>${t('adv.newHero')}</h4><p><span style="font-size:2rem">${c.emoji}</span> ${t('adv.heroWaits', { name: L(c.name) })}</p></div>`).join('')}
        ${bossBeaten && worldId < WORLDS.length - 1 ? `<div class="solution-box rankup"><h4>${t('adv.newWorld')}</h4><p>${WORLDS[worldId + 1].emoji} ${t('adv.worldUnlocked', { name: L(WORLDS[worldId + 1].name) })}</p></div>` : ''}
        ${stars === 0 ? `<p class="sub">${t('adv.needHalf')}</p>` : ''}
        <div class="btn-row" style="justify-content:center">
          ${stars < 3 ? `<button class="btn secondary" id="btn-retry">${t('adv.retry')}</button>` : ''}
          <button class="btn" id="btn-map">${t('adv.toMap')}</button>
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
