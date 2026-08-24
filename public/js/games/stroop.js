// ===== Farb-Wort-Test (Stroop): Klicke die FARBE, nicht das Wort! =====
import { shuffle, pick } from '../core.js';

const COLORS = [
  { name: 'Rot',    css: '#e04a4a' },
  { name: 'Blau',   css: '#3b6fe0' },
  { name: 'Grün',   css: '#2f9e55' },
  { name: 'Gelb',   css: '#d9a514' },
  { name: 'Lila',   css: '#9b59d0' },
  { name: 'Orange', css: '#e07f22' },
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
    while (ink.name === word.name && palette.length > 1) ink = pick(palette);
    const mode = cfg.tricky && Math.random() < 0.45 ? 'wort' : 'farbe';
    const correct = mode === 'farbe' ? ink.name : word.name;
    current = { word, ink, mode, correct };

    container.innerHTML = `
      <p class="task-question">${mode === 'farbe'
        ? '🎨 Klicke die <strong>Farbe</strong>, in der das Wort geschrieben ist – nicht das Wort selbst!'
        : '✏️ Achtung, Wechsel: Klicke, <strong>was das Wort sagt</strong> – ignoriere die Farbe!'}</p>
      <p class="sub" style="text-align:center;color:var(--muted)">Runde ${round + 1} von ${cfg.rounds} – eine falsche Antwort beendet die Serie!</p>
      <div class="stroop-word" style="color:${current.ink.css}">${current.word.name.toUpperCase()}</div>
      <div class="mc-grid">
        ${palette.map(c => `<button class="mc-btn" data-name="${c.name}">${c.name}</button>`).join('')}
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
            feedback.textContent = `✅ Alle ${cfg.rounds} Runden geschafft – starke Konzentration!`;
            feedback.className = 'feedback ok';
            api.finish(true);
          } else {
            newRound();
          }
        } else {
          b.classList.add('wrong');
          feedback.textContent = `❌ Leider falsch – richtig wäre „${current.correct}" gewesen.`;
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
        <div class="solution-box"><h4>💡 Lösung</h4>
          <p>Die richtige Antwort war: <strong>${current.correct}</strong>.</p>
          <p>Tipp: Sprich innerlich nur die ${current.mode === 'farbe' ? 'Farbe' : 'Bedeutung'} aus und blende den Rest bewusst aus –
          genau dieser Konflikt trainiert deine Impulskontrolle.</p>
        </div>`;
    },
  };
}
