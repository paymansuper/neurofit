// ===== Waage-Rätsel: Emoji-Gleichungen lösen =====
import { randInt, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';
import { t as tr } from '../i18n.js';

const SYMBOLS = ['🍎', '🍐', '🍋', '🍇', '🍉', '🥝'];

function generate(difficulty) {
  const [A, B, C] = shuffle([...SYMBOLS]);

  if (difficulty === 'sehr-leicht') {
    const a = randInt(1, 5);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`],
      question: `${A} = ?`,
      answer: a,
      steps: [tr('waage.also', { eq: `${A} + ${A} = ${2 * a} → ${A} = ${2 * a} : 2 = ${a}` })],
    };
  }
  if (difficulty === 'leicht') {
    const a = randInt(1, 6), b = randInt(1, 6);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`],
      question: `${B} = ?`,
      answer: b,
      steps: [tr('waage.row1', { eq: `${A} = ${a}` }), tr('waage.then', { eq: `${a} + ${B} = ${a + b} → ${B} = ${b}` })],
    };
  }
  if (difficulty === 'mittel') {
    const a = randInt(2, 7), b = randInt(1, 8);
    return {
      eqs: [`${A} + ${A} + ${A} = ${3 * a}`, `${A} + ${B} = ${a + b}`],
      question: `${B} + ${B} = ?`,
      answer: 2 * b,
      steps: [tr('waage.row1', { eq: `${A} = ${3 * a} : 3 = ${a}` }), tr('waage.then', { eq: `${B} = ${a + b} − ${a} = ${b}` }), tr('waage.also', { eq: `${B} + ${B} = ${2 * b}` })],
    };
  }
  if (difficulty === 'schwer') {
    const a = randInt(2, 9), b = randInt(1, 9), c = randInt(1, 9);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`],
      question: `${C} = ?`,
      answer: c,
      steps: [tr('waage.row', { eq: `${A} = ${a}`, n: 1 }), tr('waage.row', { eq: `${B} = ${a + b} − ${a} = ${b}`, n: 2 }), tr('waage.row', { eq: `${C} = ${b + c} − ${b} = ${c}`, n: 3 })],
    };
  }
  // experte: Gleichungssystem ohne direkte Auflösung – Summe aller drei Zeilen halbieren!
  const a = randInt(2, 10), b = randInt(2, 10), c = randInt(2, 10);
  return {
    eqs: [`${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`, `${A} + ${C} = ${a + c}`],
    question: `${A} + ${B} + ${C} = ?`,
    answer: a + b + c,
    steps: [
      tr('waage.addAll', { eq: `2·(${A} + ${B} + ${C}) = ${a + b} + ${b + c} + ${a + c} = ${2 * (a + b + c)}` }),
      tr('waage.also', { eq: `${A} + ${B} + ${C} = ${2 * (a + b + c)} : 2 = ${a + b + c}` }),
      tr('waage.single', { list: `${A} = ${a}, ${B} = ${b}, ${C} = ${c}` }),
    ],
  };
}

export function renderWaage(container, difficulty, api) {
  const t = generate(difficulty);
  const wrapper = document.createElement('div');
  container.appendChild(wrapper);
  wrapper.innerHTML = `<div class="waage-eqs">${t.eqs.map(e => `<div>⚖️ ${e}</div>`).join('')}</div>`;

  const taskDiv = document.createElement('div');
  container.appendChild(taskDiv);
  return simpleInputTask(taskDiv, api, {
    question: tr('waage.question', { q: t.question.replace('= ?', '').trim() }),
    answer: String(t.answer),
    inputMode: 'numeric',
    solutionHtml: `<p>${tr('shell.answer')}: <strong>${t.answer}</strong></p><ol style="margin:0.4rem 0 0 1.2rem">${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>`,
  });
}
