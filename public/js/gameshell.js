// ===== Gemeinsames Spiel-Gerüst: Schwierigkeitswahl, Auswertung, Lösung =====
import { DIFFICULTIES, recommendedDifficulty, updateRating, eloToLevel, escapeHtml, checkAchievements } from './core.js';
import { sparkle, celebrateAchievements } from './effects.js';
import { t, L } from './i18n.js';

/**
 * Baut den Rahmen für ein Spiel auf.
 * game: { id, name, icon }
 * renderTask(container, difficultyId, api) — zeichnet eine Aufgabe.
 * api: { finish(won), showSolutionUsed(), newTask() }
 */
export function gameShell(root, profile, game, renderTask, goHome) {
  let difficulty = recommendedDifficulty(profile, game.id);
  let solutionUsed = false;
  let finished = false;

  function header() {
    const r = profile.ratings[game.id];
    const lvl = eloToLevel(r.elo);
    return `
      <div class="game-header">
        <h2>${game.icon} ${escapeHtml(L(game.name))}</h2>
        <div>
          <span class="pill">${t('shell.skill')}: ${r.elo} ${lvl.emoji}</span>
          <span class="pill">🔥 ${t('shell.streak')}: ${r.streak}</span>
        </div>
      </div>`;
  }

  function diffRow() {
    const rec = recommendedDifficulty(profile, game.id);
    return `<div class="diff-row">${DIFFICULTIES.map(d => `
      <button class="diff-btn ${d.id === difficulty ? 'active' : ''}" data-diff="${d.id}">
        ${L(d.label)}${d.id === rec ? `<span class="rec">${t('shell.recommended')}</span>` : ''}
      </button>`).join('')}</div>`;
  }

  function render() {
    solutionUsed = false;
    finished = false;
    root.innerHTML = `
      <div class="card">
        ${header()}
        ${diffRow()}
        <div id="task-area"></div>
        <div class="btn-row">
          <button class="btn secondary" id="btn-solution">${t('shell.showSolution')}</button>
          <button class="btn secondary" id="btn-new">${t('shell.newTask')}</button>
          <button class="btn ghost" id="btn-back">${t('shell.back')}</button>
        </div>
        <div id="result-area"></div>
      </div>`;

    root.querySelectorAll('.diff-btn').forEach(b => {
      b.addEventListener('click', () => { difficulty = b.dataset.diff; render(); });
    });
    root.querySelector('#btn-new').addEventListener('click', render);
    root.querySelector('#btn-back').addEventListener('click', goHome);

    const api = {
      difficulty,
      finish(won) {
        if (finished) return;
        finished = true;
        const delta = updateRating(profile, game.id, difficulty, won, solutionUsed);
        showResult(won, delta);
      },
      markSolutionUsed() { solutionUsed = true; },
      isFinished: () => finished,
      rerender: render,
    };

    const solutionBtn = root.querySelector('#btn-solution');
    const taskArea = root.querySelector('#task-area');
    const taskCtrl = renderTask(taskArea, difficulty, api) || {};

    solutionBtn.addEventListener('click', () => {
      if (finished) return;
      solutionUsed = true;
      if (taskCtrl.showSolution) taskCtrl.showSolution();
      api.finish(false);
    });
  }

  function showResult(won, delta) {
    const area = root.querySelector('#result-area');
    const r = profile.ratings[game.id];
    const cls = delta >= 0 ? 'up' : 'down';
    const sign = delta >= 0 ? '+' : '';
    area.innerHTML = `
      <div class="round-result">
        <p class="delta ${cls}">${won ? t('shell.correct') : t('shell.solutionUsed')} ${sign}${delta} ${t('shell.points')}</p>
        <p class="sub">${t('shell.rating')} <strong>${r.elo}</strong> ${eloToLevel(r.elo).emoji}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="btn-next">${t('shell.next')}</button>
        </div>
      </div>`;
    area.querySelector('#btn-next').addEventListener('click', render);
    // Header-Pills aktualisieren
    const headerEl = root.querySelector('.game-header');
    if (headerEl) headerEl.outerHTML = header();
    if (won) sparkle(area.querySelector('.delta'));
    celebrateAchievements(checkAchievements(profile));
  }

  render();
}

/** Hilfsfunktion: einfache Eingabe-Aufgabe (Frage → Textfeld → prüfen) */
export function simpleInputTask(container, api, { question, answer, solutionHtml, inputMode = 'text', normalize }) {
  container.innerHTML = `
    <p class="task-question">${question}</p>
    <div class="answer-center">
      <input class="answer-input" id="answer" inputmode="${inputMode === 'numeric' ? 'numeric' : 'text'}"
             autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${t('shell.answerLabel')}">
      <button class="btn" id="check">${t('shell.check')}</button>
    </div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const input = container.querySelector('#answer');
  const feedback = container.querySelector('#feedback');
  const norm = normalize || (s => String(s).trim().toLowerCase().replace(/,/g, '.'));

  let attempts = 0;
  function check() {
    if (api.isFinished()) return;
    const val = norm(input.value);
    if (!val) return;
    if (val === norm(answer)) {
      feedback.textContent = t('shell.right');
      feedback.className = 'feedback ok';
      api.finish(true);
    } else {
      attempts++;
      if (attempts >= 3) {
        feedback.textContent = t('shell.rightAnswerWas', { a: answer });
        feedback.className = 'feedback bad';
        api.finish(false);
      } else {
        feedback.textContent = t('shell.tryAgain', { n: attempts });
        feedback.className = 'feedback bad';
      }
    }
  }

  container.querySelector('#check').addEventListener('click', check);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  input.focus();

  return {
    showSolution() {
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>${t('shell.solution')}</h4>${solutionHtml || `<p>${t('shell.answer')}: <strong>${answer}</strong></p>`}</div>`;
    },
  };
}

/** Hilfsfunktion: Multiple-Choice-Aufgabe */
export function multipleChoiceTask(container, api, { question, options, correctIndex, solutionHtml, extraHtml = '' }) {
  container.innerHTML = `
    ${extraHtml}
    <p class="task-question">${question}</p>
    <div class="mc-grid">${options.map((o, i) => `<button class="mc-btn" data-i="${i}">${o}</button>`).join('')}</div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const feedback = container.querySelector('#feedback');
  container.querySelectorAll('.mc-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (api.isFinished()) return;
      const i = Number(b.dataset.i);
      if (i === correctIndex) {
        b.classList.add('correct');
        feedback.textContent = t('shell.right');
        feedback.className = 'feedback ok';
        api.finish(true);
      } else {
        b.classList.add('wrong');
        container.querySelectorAll('.mc-btn')[correctIndex].classList.add('correct');
        feedback.textContent = t('shell.wrong');
        feedback.className = 'feedback bad';
        api.finish(false);
      }
    });
  });

  return {
    showSolution() {
      container.querySelectorAll('.mc-btn')[correctIndex].classList.add('correct');
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>${t('shell.solution')}</h4>${solutionHtml || `<p>${t('shell.correctAnswer')}: <strong>${options[correctIndex]}</strong></p>`}</div>`;
    },
  };
}
