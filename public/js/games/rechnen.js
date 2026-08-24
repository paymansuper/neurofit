// ===== Kopfrechnen: zufällig generierte Rechenaufgaben je Schwierigkeit =====
import { randInt, pick } from '../core.js';
import { simpleInputTask } from '../gameshell.js';

function generate(difficulty) {
  switch (difficulty) {
    case 'sehr-leicht': {
      // Addition/Subtraktion bis 20, kein negatives Ergebnis
      const op = pick(['+', '-']);
      let a = randInt(1, 20), b = randInt(1, 10);
      if (op === '-' && b > a) [a, b] = [b, a];
      const result = op === '+' ? a + b : a - b;
      return { text: `${a} ${op} ${b} = ?`, answer: result, explain: `${a} ${op} ${b} = ${result}` };
    }
    case 'leicht': {
      const op = pick(['+', '-', '×']);
      if (op === '×') {
        const a = randInt(2, 10), b = randInt(2, 10);
        return { text: `${a} × ${b} = ?`, answer: a * b, explain: `Kleines Einmaleins: ${a} × ${b} = ${a * b}` };
      }
      let a = randInt(10, 100), b = randInt(10, 50);
      if (op === '-' && b > a) [a, b] = [b, a];
      const result = op === '+' ? a + b : a - b;
      return { text: `${a} ${op} ${b} = ?`, answer: result, explain: `${a} ${op} ${b} = ${result}` };
    }
    case 'mittel': {
      const type = pick(['mul', 'div', 'chain']);
      if (type === 'mul') {
        const a = randInt(11, 25), b = randInt(3, 12);
        return { text: `${a} × ${b} = ?`, answer: a * b, explain: `Tipp: ${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * b}` };
      }
      if (type === 'div') {
        const b = randInt(3, 12), q = randInt(4, 25);
        const a = b * q;
        return { text: `${a} ÷ ${b} = ?`, answer: q, explain: `${b} × ${q} = ${a}, also ${a} ÷ ${b} = ${q}` };
      }
      const a = randInt(10, 60), b = randInt(5, 30), c = randInt(2, 20);
      const result = a + b - c;
      return { text: `${a} + ${b} − ${c} = ?`, answer: result, explain: `${a} + ${b} = ${a + b}, dann − ${c} = ${result}` };
    }
    case 'schwer': {
      const type = pick(['pct', 'mul2', 'mix']);
      if (type === 'pct') {
        const pct = pick([5, 10, 15, 20, 25, 50, 75]);
        const base = randInt(2, 40) * 20;
        const result = (base * pct) / 100;
        return { text: `${pct} % von ${base} = ?`, answer: result, explain: `${base} × ${pct}/100 = ${result}` };
      }
      if (type === 'mul2') {
        const a = randInt(12, 40), b = randInt(12, 30);
        return { text: `${a} × ${b} = ?`, answer: a * b, explain: `${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10} = ${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${a * b}` };
      }
      const a = randInt(3, 15), b = randInt(3, 12), c = randInt(10, 99);
      const result = a * b + c;
      return { text: `${a} × ${b} + ${c} = ?`, answer: result, explain: `${a} × ${b} = ${a * b}, dann + ${c} = ${result}` };
    }
    case 'experte':
    default: {
      const type = pick(['sq', 'pct2', 'chain3']);
      if (type === 'sq') {
        const a = randInt(13, 35);
        return { text: `${a}² = ?`, answer: a * a, explain: `${a}² = ${a} × ${a} = ${a * a}` };
      }
      if (type === 'pct2') {
        const pct = pick([12, 15, 17, 22, 35, 45, 65, 85]);
        const base = randInt(2, 30) * 50;
        const result = (base * pct) / 100;
        return { text: `${pct} % von ${base} = ?`, answer: result, explain: `10 % von ${base} = ${base / 10}. Damit: ${pct} % = ${result}` };
      }
      const a = randInt(15, 60), b = randInt(11, 30), c = randInt(2, 9), d = randInt(10, 99);
      const result = (a + b) * c - d;
      return { text: `(${a} + ${b}) × ${c} − ${d} = ?`, answer: result, explain: `${a} + ${b} = ${a + b} → × ${c} = ${(a + b) * c} → − ${d} = ${result}` };
    }
  }
}

export function renderRechnen(container, difficulty, api) {
  const t = generate(difficulty);
  return simpleInputTask(container, api, {
    question: t.text,
    answer: String(t.answer),
    inputMode: 'numeric',
    solutionHtml: `<p><strong>${t.answer}</strong></p><p>${t.explain}</p>`,
  });
}
