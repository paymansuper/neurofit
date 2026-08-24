// ===== Merkspiel: Zahlen-/Symbolfolgen einprägen und wiedergeben =====
import { randInt, pick, escapeHtml } from '../core.js';
import { t } from '../i18n.js';

const CONFIG = {
  'sehr-leicht': { len: 3, showMs: 5000, mode: 'digits' },
  'leicht':      { len: 4, showMs: 4500, mode: 'digits' },
  'mittel':      { len: 6, showMs: 5000, mode: 'digits' },
  'schwer':      { len: 7, showMs: 5000, mode: 'mixed' },
  'experte':     { len: 9, showMs: 5500, mode: 'mixed' },
};

const SYMBOLS = ['★', '♥', '◆', '●', '▲'];

function generate(difficulty) {
  const { len, showMs, mode } = CONFIG[difficulty];
  const seq = [];
  for (let i = 0; i < len; i++) {
    if (mode === 'mixed' && Math.random() < 0.3) seq.push(pick(SYMBOLS));
    else seq.push(String(randInt(0, 9)));
  }
  return { seq, showMs, mode };
}

export function renderMerken(container, difficulty, api) {
  const { seq, showMs, mode } = generate(difficulty);
  const answer = seq.join('');
  let timerId = null;

  container.innerHTML = `
    <p class="task-question">${t('merken.memorize')}</p>
    <div class="memory-display" id="display" aria-live="assertive"></div>
    <p class="memory-timer" id="timer"></p>
    <div id="input-area"></div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const display = container.querySelector('#display');
  const timerEl = container.querySelector('#timer');
  display.textContent = seq.join(' ');

  let remaining = Math.round(showMs / 1000);
  timerEl.textContent = t('merken.seconds', { n: remaining });
  timerId = setInterval(() => {
    remaining--;
    if (!container.isConnected) { clearInterval(timerId); return; }
    if (remaining <= 0) {
      clearInterval(timerId);
      hideAndAsk();
    } else {
      timerEl.textContent = t('merken.seconds', { n: remaining });
    }
  }, 1000);

  function hideAndAsk() {
    if (api.isFinished()) return;
    display.textContent = '❓';
    timerEl.textContent = '';
    const area = container.querySelector('#input-area');

    if (mode === 'mixed') {
      // Klick-Eingabe für Symbole + Ziffern
      let entered = '';
      area.innerHTML = `
        <div class="memory-display" id="entered" style="min-height:2.5rem;font-size:1.5rem"></div>
        <div class="numpad" id="pad"></div>
        <div class="answer-center" style="margin-top:0.8rem">
          <button class="btn" id="check">${t('shell.check')}</button>
        </div>`;
      const pad = area.querySelector('#pad');
      const enteredEl = area.querySelector('#entered');
      const keys = ['0','1','2','3','4','5','6','7','8','9', ...SYMBOLS, '⌫'];
      for (const k of keys) {
        const b = document.createElement('button');
        b.textContent = k;
        b.addEventListener('click', () => {
          if (api.isFinished()) return;
          if (k === '⌫') entered = entered.slice(0, -1);
          else if (entered.length < seq.length) entered += k;
          enteredEl.textContent = entered.split('').join(' ');
        });
        pad.appendChild(b);
      }
      area.querySelector('#check').addEventListener('click', () => check(entered));
    } else {
      area.innerHTML = `
        <div class="answer-center">
          <input class="answer-input" id="answer" inputmode="numeric" autocomplete="off" aria-label="${t('merken.inputAria')}">
          <button class="btn" id="check">${t('shell.check')}</button>
        </div>`;
      const input = area.querySelector('#answer');
      input.focus();
      const doCheck = () => check(input.value.replace(/\s/g, ''));
      area.querySelector('#check').addEventListener('click', doCheck);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(); });
    }
  }

  function check(val) {
    if (api.isFinished()) return;
    if (!val) return; // leere Eingabe nicht als Fehler werten
    const feedback = container.querySelector('#feedback');
    if (val === answer) {
      feedback.textContent = t('merken.perfect');
      feedback.className = 'feedback ok';
      api.finish(true);
    } else {
      feedback.innerHTML = t('merken.notQuite', { seq: escapeHtml(seq.join(' ')) });
      feedback.className = 'feedback bad';
      api.finish(false);
    }
  }

  return {
    showSolution() {
      clearInterval(timerId);
      container.querySelector('#solution-slot').innerHTML =
        `<div class="solution-box"><h4>${t('shell.solution')}</h4><p>${t('merken.was', { seq: escapeHtml(seq.join(' ')) })}</p>
         <p>${t('merken.tip')}</p></div>`;
    },
  };
}
