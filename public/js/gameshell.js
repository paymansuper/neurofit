// ===== Gemeinsames Spiel-Gerüst: Schwierigkeitswahl, Auswertung, Lösung =====
import { DIFFICULTIES, recommendedDifficulty, updateRating, eloToLevel, escapeHtml, checkAchievements } from './core.js';
import { sparkle, celebrateAchievements } from './effects.js';

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
        <h2>${game.icon} ${escapeHtml(game.name)}</h2>
        <div>
          <span class="pill">Skill: ${r.elo} ${lvl.emoji}</span>
          <span class="pill">🔥 Serie: ${r.streak}</span>
        </div>
      </div>`;
  }

  function diffRow() {
    const rec = recommendedDifficulty(profile, game.id);
    return `<div class="diff-row">${DIFFICULTIES.map(d => `
      <button class="diff-btn ${d.id === difficulty ? 'active' : ''}" data-diff="${d.id}">
        ${d.label}${d.id === rec ? '<span class="rec">empfohlen</span>' : ''}
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
          <button class="btn secondary" id="btn-solution">💡 Lösung zeigen</button>
          <button class="btn secondary" id="btn-new">🔄 Neue Aufgabe</button>
          <button class="btn ghost" id="btn-back">← Zurück zur Übersicht</button>
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
        <p class="delta ${cls}">${won ? '🎉 Richtig gelöst!' : solutionUsedText()} ${sign}${delta} Punkte</p>
        <p class="sub">Dein Skillrating: <strong>${r.elo}</strong> ${eloToLevel(r.elo).emoji}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="btn-next">Nächste Aufgabe →</button>
        </div>
      </div>`;
    area.querySelector('#btn-next').addEventListener('click', render);
    // Header-Pills aktualisieren
    const headerEl = root.querySelector('.game-header');
    if (headerEl) headerEl.outerHTML = header();
    if (won) sparkle(area.querySelector('.delta'));
    celebrateAchievements(checkAchievements(profile));
  }

  function solutionUsedText() {
    return '💡 Kein Problem – mit der Lösung lernst du auch!';
  }

  render();
}

/** Hilfsfunktion: einfache Eingabe-Aufgabe (Frage → Textfeld → prüfen) */
export function simpleInputTask(container, api, { question, answer, solutionHtml, inputMode = 'text', normalize }) {
  container.innerHTML = `
    <p class="task-question">${question}</p>
    <div class="answer-center">
      <input class="answer-input" id="answer" inputmode="${inputMode === 'numeric' ? 'numeric' : 'text'}"
             autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Deine Antwort">
      <button class="btn" id="check">Prüfen ✓</button>
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
      feedback.textContent = '✅ Richtig!';
      feedback.className = 'feedback ok';
      api.finish(true);
    } else {
      attempts++;
      if (attempts >= 3) {
        feedback.textContent = `❌ Leider falsch. Die richtige Antwort war: ${answer}`;
        feedback.className = 'feedback bad';
        api.finish(false);
      } else {
        feedback.textContent = `❌ Noch nicht richtig – versuch es nochmal! (Versuch ${attempts}/3)`;
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
        <div class="solution-box"><h4>💡 Lösung</h4>${solutionHtml || `<p>Antwort: <strong>${answer}</strong></p>`}</div>`;
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
        feedback.textContent = '✅ Richtig!';
        feedback.className = 'feedback ok';
        api.finish(true);
      } else {
        b.classList.add('wrong');
        container.querySelectorAll('.mc-btn')[correctIndex].classList.add('correct');
        feedback.textContent = '❌ Leider falsch.';
        feedback.className = 'feedback bad';
        api.finish(false);
      }
    });
  });

  return {
    showSolution() {
      container.querySelectorAll('.mc-btn')[correctIndex].classList.add('correct');
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>💡 Lösung</h4>${solutionHtml || `<p>Richtige Antwort: <strong>${options[correctIndex]}</strong></p>`}</div>`;
    },
  };
}
