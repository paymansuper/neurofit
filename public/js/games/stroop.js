// ===== Farb-Wort-Test (Stroop): Klicke die FARBE, nicht das Wort! =====
import { shuffle, pick } from '../core.js';
import { t, L } from '../i18n.js';

const COLORS = [
  { name: { de: 'Rot', en: 'Red' },       css: '#e04a4a' },
  { name: { de: 'Blau', en: 'Blue' },     css: '#3b6fe0' },
  { name: { de: 'Grün', en: 'Green' },    css: '#2f9e55' },
  { name: { de: 'Gelb', en: 'Yellow' },   css: '#d9a514' },
  { name: { de: 'Lila', en: 'Purple' },   css: '#9b59d0' },
  { name: { de: 'Orange', en: 'Orange' }, css: '#e07f22' },
];

const CONFIG = {
  'sehr-leicht': { options: 3, rounds: 2, tricky: false },
  'leicht':      { options: 4, rounds: 3, tricky: false },
  'mittel':      { options: 4, rounds: 4, tricky: true },
  'schwer':      { options: 5, rounds: 5, tricky: true },
  'experte':     { options: 6, rounds: 6, tricky: true },
};

export function renderStroop(container, difficulty, api) {
  const cfg = CONFIG[difficulty];
  const palette = shuffle([...COLORS]).slice(0, cfg.options);
  let round = 0;
  let current = null; // { word, ink, mode, correct }

  function newRound() {
    const word = pick(palette);
    let ink = pick(palette);
    while (L(ink.name) === L(word.name) && palette.length > 1) ink = pick(palette);
    const mode = cfg.tricky && Math.random() < 0.45 ? 'wort' : 'farbe';
    const correct = mode === 'farbe' ? L(ink.name) : L(word.name);
    current = { word, ink, mode, correct };

    container.innerHTML = `
      <p class="task-question">${mode === 'farbe' ? t('stroop.clickColor') : t('stroop.clickWord')}</p>
      <p class="sub" style="text-align:center;color:var(--muted)">${t('stroop.round', { i: round + 1, n: cfg.rounds })}</p>
      <div class="stroop-word" style="color:${current.ink.css}">${L(current.word.name).toUpperCase()}</div>
      <div class="mc-grid">
        ${palette.map(c => `<button class="mc-btn" data-name="${L(c.name)}">${L(c.name)}</button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
      <div id="solution-slot"></div>`;

    container.querySelectorAll('.mc-btn').forEach(b => {
      b.addEventListener('click', () => {
        if (api.isFinished()) return;
        const feedback = container.querySelector('#feedback');
        if (b.dataset.name === current.correct) {
          round++;
          if (round >= cfg.rounds) {
            b.classList.add('correct');
            feedback.textContent = t('stroop.allDone', { n: cfg.rounds });
            feedback.className = 'feedback ok';
            api.finish(true);
          } else {
            newRound();
          }
        } else {
          b.classList.add('wrong');
          feedback.textContent = t('stroop.wrongWas', { c: current.correct });
          feedback.className = 'feedback bad';
          api.finish(false);
        }
      });
    });
  }

  newRound();

  return {
    showSolution() {
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>${t('shell.solution')}</h4>
          <p>${t('stroop.solWas', { c: current.correct })}</p>
          <p>${current.mode === 'farbe' ? t('stroop.tipColor') : t('stroop.tipWord')}</p>
        </div>`;
    },
  };
}
