// ===== Paare finden (Memory): Karten aufdecken, gleiche Paare merken =====
import { shuffle } from '../core.js';
import { t } from '../i18n.js';

const EMOJIS = ['🐶','🐱','🦊','🐸','🐝','🦋','🌻','🍓','🍀','⚽','🎈','🚗','⭐','🌙','🍕','🎁','🐢','🦉','🍄','⛵','🎸','🧸','🔑','☂️'];

const CONFIG = {
  'sehr-leicht': { pairs: 3,  maxMiss: 6 },
  'leicht':      { pairs: 4,  maxMiss: 7 },
  'mittel':      { pairs: 6,  maxMiss: 9 },
  'schwer':      { pairs: 8,  maxMiss: 10 },
  'experte':     { pairs: 10, maxMiss: 11 },
};

export function renderMemory(container, difficulty, api) {
  const cfg = CONFIG[difficulty];
  const chosen = shuffle([...EMOJIS]).slice(0, cfg.pairs);
  const cards = shuffle([...chosen, ...chosen]);
  const cols = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : 5;

  let open = [];       // Indizes aktuell offener Karten (max 2)
  let matched = new Set();
  let misses = 0;
  let locked = false;

  container.innerHTML = `
    <p class="task-question">${t('memory.instruction', { p: cfg.pairs, m: cfg.maxMiss })}</p>
    <p class="sub" style="text-align:center;color:var(--muted)" id="miss-counter">${t('memory.misses', { n: 0, max: cfg.maxMiss })}</p>
    <div class="memo-grid" style="--cols:${cols}">
      ${cards.map((_, i) => `<button class="memo-card" data-i="${i}" aria-label="${t('memory.card', { n: i + 1 })}">❓</button>`).join('')}
    </div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const els = [...container.querySelectorAll('.memo-card')];
  const feedback = container.querySelector('#feedback');
  const missEl = container.querySelector('#miss-counter');

  function revealAll() {
    els.forEach((el, i) => { el.textContent = cards[i]; el.classList.add('open'); });
  }

  els.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (api.isFinished() || locked || matched.has(i) || open.includes(i)) return;
      el.textContent = cards[i];
      el.classList.add('open');
      open.push(i);
      if (open.length < 2) return;

      const [a, b] = open;
      if (cards[a] === cards[b]) {
        matched.add(a); matched.add(b);
        els[a].classList.add('matched');
        els[b].classList.add('matched');
        open = [];
        if (matched.size === cards.length) {
          feedback.textContent = t('memory.allFound', { n: misses });
          feedback.className = 'feedback ok';
          api.finish(true);
        }
      } else {
        misses++;
        missEl.textContent = t('memory.misses', { n: misses, max: cfg.maxMiss });
        if (misses > cfg.maxMiss) {
          revealAll();
          feedback.textContent = t('memory.tooMany');
          feedback.className = 'feedback bad';
          api.finish(false);
          return;
        }
        locked = true;
        setTimeout(() => {
          els[a].textContent = '❓'; els[a].classList.remove('open');
          els[b].textContent = '❓'; els[b].classList.remove('open');
          open = [];
          locked = false;
        }, 750);
      }
    });
  });

  return {
    showSolution() {
      revealAll();
      container.querySelector('#solution-slot').innerHTML = `
        <div class="solution-box"><h4>${t('shell.solution')}</h4>
          <p>${t('memory.revealed')}</p>
          <p>${t('memory.tip')}</p>
        </div>`;
    },
  };
}
