// ===== Wortgitter: Verstecktes Wort im Buchstabenraster finden =====
import { randInt, pick } from '../core.js';

const WORDS = {
  'sehr-leicht': ['OMA', 'HUND', 'BALL', 'HAUS', 'ROT', 'EIS', 'AUTO', 'BAUM', 'SONNE', 'KATZE'],
  'leicht':      ['GARTEN', 'BLUME', 'WINTER', 'SCHULE', 'APFEL', 'TISCH', 'WOLKE', 'BROT', 'VOGEL', 'REGEN'],
  'mittel':      ['FENSTER', 'GEBIRGE', 'MUSKEL', 'PLANET', 'THEATER', 'KOMPASS', 'LATERNE', 'SCHATTEN', 'KAPITEL', 'WERKZEUG'],
  'schwer':      ['BIBLIOTHEK', 'SCHMETTERLING', 'ORCHESTER', 'LABYRINTH', 'HORIZONT', 'VULKANE', 'PYRAMIDE', 'KALENDER', 'MIKROSKOP'],
  'experte':     ['GEDAECHTNIS', 'KONZENTRATION', 'ARCHITEKTUR', 'PHILOSOPHIE', 'ATMOSPHAERE', 'ENZYKLOPAEDIE', 'PERSPEKTIVE'],
};

const CONFIG = {
  'sehr-leicht': { size: 6,  dirs: ['h'] },
  'leicht':      { size: 8,  dirs: ['h', 'v'] },
  'mittel':      { size: 9,  dirs: ['h', 'v'] },
  'schwer':      { size: 11, dirs: ['h', 'v', 'd'] },
  'experte':     { size: 13, dirs: ['h', 'v', 'd'] },
};

// Buchstabenhäufigkeit (grob deutsch) für die Füllbuchstaben
const FILL = 'EEEEEENNNNNIIIRRRSSSAAATTTDDHHUULLCCGGMMOOBBWWFFKKZZPV';

export function renderWortgitter(container, difficulty, api) {
  const cfg = CONFIG[difficulty];
  const word = pick(WORDS[difficulty]);
  const n = Math.max(cfg.size, word.length);

  // Wort platzieren
  const dir = pick(cfg.dirs);
  const dr = dir === 'h' ? 0 : 1;
  const dc = dir === 'v' ? 0 : 1;
  const r0 = randInt(0, n - 1 - dr * (word.length - 1));
  const c0 = randInt(0, n - 1 - dc * (word.length - 1));
  const path = [...word].map((_, i) => (r0 + dr * i) * n + (c0 + dc * i));

  const grid = Array.from({ length: n * n }, () => FILL[randInt(0, FILL.length - 1)]);
  path.forEach((cell, i) => { grid[cell] = word[i]; });

  const maxMistakes = 3;
  let nextIdx = 0;
  let mistakes = 0;

  container.innerHTML = `
    <p class="task-question">🔠 Finde das Wort <strong>${word}</strong> im Gitter und klicke seine Buchstaben <em>der Reihe nach</em> an!</p>
    <p class="sub" style="text-align:center;color:var(--muted)" id="wg-status">Richtung: waagrecht${cfg.dirs.includes('v') ? ', senkrecht' : ''}${cfg.dirs.includes('d') ? ' oder diagonal' : ''} · Fehlklicks: 0 / ${maxMistakes}</p>
    <div class="wg-grid" style="--n:${n}">
      ${grid.map((ch, i) => `<button class="wg-cell" data-i="${i}">${ch}</button>`).join('')}
    </div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const cells = [...container.querySelectorAll('.wg-cell')];
  const feedback = container.querySelector('#feedback');
  const statusEl = container.querySelector('#wg-status');

  function revealPath() {
    path.forEach(i => cells[i].classList.add('reveal'));
  }

  cells.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (api.isFinished() || el.classList.contains('found')) return;
      if (i === path[nextIdx]) {
        el.classList.add('found');
        nextIdx++;
        if (nextIdx === path.length) {
          feedback.textContent = `✅ Super gefunden – „${word}" war gut versteckt!`;
          feedback.className = 'feedback ok';
          api.finish(true);
        }
      } else {
        mistakes++;
        el.classList.add('wrong');
        setTimeout(() => el.classList.remove('wrong'), 500);
        statusEl.textContent = `Fehlklicks: ${mistakes} / ${maxMistakes}`;
        if (mistakes >= maxMistakes) {
          revealPath();
          feedback.textContent = '❌ Zu viele Fehlklicks – hier war das Wort versteckt.';
          feedback.className = 'feedback bad';
          api.finish(false);
        } else {
          feedback.textContent = nextIdx > 0
            ? `❌ Das war nicht der nächste Buchstabe – gesucht ist „${word[nextIdx]}".`
            : `❌ Dort beginnt das Wort nicht – suche den Anfangsbuchstaben „${word[0]}".`;
          feedback.className = 'feedback bad';
        }
      }
    });
  });

  return {
    showSolution() {
      revealPath();
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>💡 Lösung</h4>
          <p>Das Wort <strong>${word}</strong> ist jetzt markiert.</p>
          <p>Tipp: Suche zuerst nur den Anfangsbuchstaben und prüfe von dort aus alle Richtungen – Zeile für Zeile scannen ist schneller als wildes Springen.</p>
        </div>`;
    },
  };
}
