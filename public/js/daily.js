// ===== Tages-Challenge: 3 Aufgaben pro Tag, Tagesstreak, Bonus-XP =====
// Alle Spieler bekommen am selben Tag dieselben Kategorien (deterministischer Seed).
import {
  GAMES, saveProfile, recommendedDifficulty, xpToRank,
  todayISO, dailySeededRandom, completeDailyChallenge, currentDailyStreak, checkAchievements,
} from './core.js';
import { confetti, celebrateAchievements } from './effects.js';
import { RENDERERS } from './renderers.js';
import { t, L } from './i18n.js';

const TASK_COUNT = 3;
const XP_PER_CORRECT = 15;
const STREAK_BONUS_PER_DAY = 5; // ×Streak, gedeckelt
const MAX_STREAK_BONUS = 50;

/** Die heutigen Kategorien – für alle gleich, ohne Sudoku (zu lang für "kurz & täglich"). */
export function todaysGames() {
  const rnd = dailySeededRandom(todayISO());
  const pool = GAMES.filter(g => g.id !== 'sudoku').map(g => g.id);
  const picked = [];
  while (picked.length < TASK_COUNT) {
    const g = pool[Math.floor(rnd() * pool.length)];
    if (!picked.includes(g)) picked.push(g);
  }
  return picked;
}

export function isDailyDone(profile) {
  return profile.daily.doneDate === todayISO();
}

export function playDaily(root, profile, onExit) {
  const games = todaysGames();
  let taskIndex = 0;
  let correct = 0;
  const rankBefore = xpToRank(profile.adventure.xp);

  function renderTaskScreen() {
    const gameId = games[taskIndex];
    const game = GAMES.find(g => g.id === gameId);
    const difficulty = recommendedDifficulty(profile, gameId);
    root.innerHTML = `
      <div class="card">
        <div class="game-header">
          <h2>${t('daily.title')}</h2>
          <span class="pill">${game.icon} ${L(game.name)} · ${t('adv.taskOf', { i: taskIndex + 1, n: TASK_COUNT })}</span>
        </div>
        <div class="adv-progress progress-bar"><div style="width:${(taskIndex / TASK_COUNT) * 100}%"></div></div>
        <div id="task-area" style="margin-top:1rem"></div>
        <div class="btn-row">
          <button class="btn secondary" id="btn-solution">${t('shell.showSolution')}</button>
          <button class="btn ghost" id="btn-quit">${t('adv.quit')}</button>
        </div>
        <div id="continue-slot"></div>
      </div>`;

    let finished = false;
    const api = {
      difficulty,
      isFinished: () => finished,
      markSolutionUsed() {},
      finish(won) {
        if (finished) return;
        finished = true;
        if (won) correct++;
        showContinue(won);
      },
    };

    const ctrl = RENDERERS[gameId](root.querySelector('#task-area'), difficulty, api) || {};
    root.querySelector('#btn-solution').addEventListener('click', () => {
      if (finished) return;
      if (ctrl.showSolution) ctrl.showSolution();
      api.finish(false);
    });
    root.querySelector('#btn-quit').addEventListener('click', onExit);

    function showContinue(won) {
      const last = taskIndex === TASK_COUNT - 1;
      const slot = root.querySelector('#continue-slot');
      slot.innerHTML = `
        <div class="round-result">
          <p class="delta ${won ? 'up' : 'down'}">${won ? t('daily.right') : t('daily.nextTime')}</p>
          <button class="btn" id="btn-continue">${last ? t('daily.finishBtn') : t('adv.continue')}</button>
        </div>`;
      slot.querySelector('#btn-continue').addEventListener('click', () => {
        taskIndex++;
        if (taskIndex >= TASK_COUNT) finish();
        else renderTaskScreen();
      });
    }
  }

  function finish() {
    const passed = correct >= 2; // mindestens 2 von 3
    let xp = correct * XP_PER_CORRECT;
    let streakBonus = 0;
    let firstToday = false;

    if (passed) {
      firstToday = completeDailyChallenge(profile);
      if (firstToday) {
        streakBonus = Math.min(currentDailyStreak(profile) * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS);
        xp += streakBonus;
      }
    }
    profile.adventure.xp += xp;
    saveProfile(profile);

    const streak = currentDailyStreak(profile);
    const rankAfter = xpToRank(profile.adventure.xp);
    const rankUp = rankAfter.index > rankBefore.index;
    const unlocked = checkAchievements(profile);

    root.innerHTML = `
      <div class="card round-result adv-finish">
        <div class="adv-char" style="font-size:4rem">${passed ? '🔥' : '😅'}</div>
        <h2>${passed ? t('daily.done') : t('daily.missed')}</h2>
        <p>${t('daily.result', { c: correct, n: TASK_COUNT })} · <strong>+${xp} XP</strong>${streakBonus ? t('daily.streakBonus', { b: streakBonus }) : ''}</p>
        ${passed ? `<p class="daily-streak-big">${t(streak === 1 ? 'daily.dayInRow' : 'daily.daysInRow', { n: streak })}</p>` : ''}
        ${rankUp ? `<div class="solution-box rankup"><h4>${t('adv.rankUp')}</h4><p>${t('adv.youAreNow', { rank: `${rankAfter.emoji} ${L(rankAfter.name)}` })}</p></div>` : ''}
        ${!passed ? `<p class="sub">${t('daily.need2')}</p>` : `<p class="sub">${t('daily.comeback')}</p>`}
        <div class="btn-row" style="justify-content:center">
          ${!passed ? `<button class="btn secondary" id="btn-retry">${t('adv.retry')}</button>` : ''}
          <button class="btn" id="btn-home">${t('daily.toHome')}</button>
        </div>
      </div>`;

    if (passed && firstToday) confetti();
    celebrateAchievements(unlocked);

    const retry = root.querySelector('#btn-retry');
    if (retry) retry.addEventListener('click', () => playDaily(root, profile, onExit));
    root.querySelector('#btn-home').addEventListener('click', onExit);
  }

  renderTaskScreen();
}
