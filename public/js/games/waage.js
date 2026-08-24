// ===== Waage-Rätsel: Emoji-Gleichungen lösen =====
import { randInt, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';

const SYMBOLS = ['🍎', '🍐', '🍋', '🍇', '🍉', '🥝'];

function generate(difficulty) {
  const [A, B, C] = shuffle([...SYMBOLS]);

  if (difficulty === 'sehr-leicht') {
    const a = randInt(1, 5);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`],
      question: `${A} = ?`,
      answer: a,
      steps: [`${A} + ${A} = ${2 * a}, also ist ${A} = ${2 * a} : 2 = ${a}.`],
    };
  }
  if (difficulty === 'leicht') {
    const a = randInt(1, 6), b = randInt(1, 6);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`],
      question: `${B} = ?`,
      answer: b,
      steps: [`Aus der 1. Zeile: ${A} = ${a}.`, `Dann: ${a} + ${B} = ${a + b}, also ${B} = ${b}.`],
    };
  }
  if (difficulty === 'mittel') {
    const a = randInt(2, 7), b = randInt(1, 8);
    return {
      eqs: [`${A} + ${A} + ${A} = ${3 * a}`, `${A} + ${B} = ${a + b}`],
      question: `${B} + ${B} = ?`,
      answer: 2 * b,
      steps: [`Aus der 1. Zeile: ${A} = ${3 * a} : 3 = ${a}.`, `Dann: ${B} = ${a + b} − ${a} = ${b}.`, `Also: ${B} + ${B} = ${2 * b}.`],
    };
  }
  if (difficulty === 'schwer') {
    const a = randInt(2, 9), b = randInt(1, 9), c = randInt(1, 9);
    return {
      eqs: [`${A} + ${A} = ${2 * a}`, `${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`],
      question: `${C} = ?`,
      answer: c,
      steps: [`${A} = ${a} (1. Zeile).`, `${B} = ${a + b} − ${a} = ${b} (2. Zeile).`, `${C} = ${b + c} − ${b} = ${c} (3. Zeile).`],
    };
  }
  // experte: Gleichungssystem ohne direkte Auflösung – Summe aller drei Zeilen halbieren!
  const a = randInt(2, 10), b = randInt(2, 10), c = randInt(2, 10);
  return {
    eqs: [`${A} + ${B} = ${a + b}`, `${B} + ${C} = ${b + c}`, `${A} + ${C} = ${a + c}`],
    question: `${A} + ${B} + ${C} = ?`,
    answer: a + b + c,
    steps: [
      `Addiere alle drei Zeilen: 2·(${A} + ${B} + ${C}) = ${a + b} + ${b + c} + ${a + c} = ${2 * (a + b + c)}.`,
      `Also: ${A} + ${B} + ${C} = ${2 * (a + b + c)} : 2 = ${a + b + c}.`,
      `(Einzeln: ${A} = ${a}, ${B} = ${b}, ${C} = ${c})`,
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
    question: `Was ergibt: <strong>${t.question.replace('= ?', '')}</strong>?`,
    answer: String(t.answer),
    inputMode: 'numeric',
    solutionHtml: `<p>Antwort: <strong>${t.answer}</strong></p><ol style="margin:0.4rem 0 0 1.2rem">${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>`,
  });
}
