// ===== Tages-Challenge: 3 Aufgaben pro Tag, Tagesstreak, Bonus-XP =====
// Alle Spieler bekommen am selben Tag dieselben Kategorien (deterministischer Seed).
import {
  GAMES, saveProfile, recommendedDifficulty, xpToRank,
  todayISO, dailySeededRandom, completeDailyChallenge, currentDailyStreak, checkAchievements,
} from './core.js';
import { confetti, celebrateAchievements } from './effects.js';
import { RENDERERS } from './renderers.js';

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
          <h2>📅 Tages-Challenge</h2>
          <span class="pill">${game.icon} ${game.name} · Aufgabe ${taskIndex + 1}/${TASK_COUNT}</span>
        </div>
        <div class="adv-progress progress-bar"><div style="width:${(taskIndex / TASK_COUNT) * 100}%"></div></div>
        <div id="task-area" style="margin-top:1rem"></div>
        <div class="btn-row">
          <button class="btn secondary" id="btn-solution">💡 Lösung zeigen</button>
          <button class="btn ghost" id="btn-quit">✖ Abbrechen</button>
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
          <p class="delta ${won ? 'up' : 'down'}">${won ? '✅ Richtig!' : 'Nächstes Mal!'}</p>
          <button class="btn" id="btn-continue">${last ? '🏁 Challenge abschließen' : 'Weiter →'}</button>
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
        <h2>${passed ? 'Tages-Challenge geschafft!' : 'Knapp daneben!'}</h2>
        <p>${correct}/${TASK_COUNT} richtig · <strong>+${xp} XP</strong>${streakBonus ? ` (davon +${streakBonus} Streak-Bonus)` : ''}</p>
        ${passed ? `<p class="daily-streak-big">🔥 ${streak} ${streak === 1 ? 'Tag' : 'Tage'} in Folge!</p>` : ''}
        ${rankUp ? `<div class="solution-box rankup"><h4>🎉 RANG-AUFSTIEG!</h4><p>Du bist jetzt <strong>${rankAfter.emoji} ${rankAfter.name}</strong>!</p></div>` : ''}
        ${!passed ? '<p class="sub">Du brauchst 2 von 3 richtig. Kein Stress – du kannst es sofort nochmal versuchen!</p>' : '<p class="sub">Komm morgen wieder, um deinen Streak fortzusetzen!</p>'}
        <div class="btn-row" style="justify-content:center">
          ${!passed ? '<button class="btn secondary" id="btn-retry">🔄 Nochmal versuchen</button>' : ''}
          <button class="btn" id="btn-home">Zur Übersicht</button>
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
