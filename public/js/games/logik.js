// ===== Logik-Reihen: Zahlenfolgen mit Mustern, zufällig generiert =====
import { randInt, pick, shuffle } from '../core.js';
import { multipleChoiceTask } from '../gameshell.js';

function generate(difficulty) {
  const gens = {
    'sehr-leicht': [
      () => { // +konstant (klein)
        const start = randInt(1, 10), step = randInt(1, 3);
        return seq(start, n => n + step, 4, `Es wird immer +${step} gerechnet.`);
      },
      () => { // gerade/ungerade Zahlen
        const start = randInt(1, 6) * 2;
        return seq(start, n => n + 2, 4, `Immer +2 (Zweierschritte).`);
      },
    ],
    'leicht': [
      () => {
        const start = randInt(2, 20), step = randInt(3, 7);
        return seq(start, n => n + step, 4, `Es wird immer +${step} gerechnet.`);
      },
      () => {
        const start = randInt(40, 90), step = randInt(3, 8);
        return seq(start, n => n - step, 4, `Es wird immer −${step} gerechnet.`);
      },
      () => {
        const start = randInt(1, 4);
        return seq(start, n => n * 2, 4, `Jede Zahl wird verdoppelt (×2).`);
      },
    ],
    'mittel': [
      () => {
        const start = randInt(1, 5), f = pick([2, 3]);
        return seq(start, n => n * f, 4, `Jede Zahl wird mit ${f} multipliziert.`);
      },
      () => { // wachsender Abstand
        let step = randInt(1, 4);
        const start = randInt(1, 10);
        const arr = [start];
        for (let i = 0; i < 4; i++) { arr.push(arr.at(-1) + step); step++; }
        return { arr, explain: `Der Abstand wächst jedes Mal um 1 (+${step - 4}, +${step - 3}, +${step - 2}, …).` };
      },
      () => { // Quadratzahlen
        const off = randInt(1, 4);
        const arr = [1, 2, 3, 4, 5].map(n => (n + off) ** 2);
        return { arr, explain: `Es sind Quadratzahlen: ${arr.map((v, i) => `${i + 1 + off}²`).join(', ')}.` };
      },
    ],
    'schwer': [
      () => { // Fibonacci-artig
        let a = randInt(1, 5), b = randInt(1, 5);
        const arr = [a, b];
        for (let i = 0; i < 3; i++) arr.push(arr.at(-1) + arr.at(-2));
        return { arr, explain: `Jede Zahl ist die Summe der beiden vorherigen.` };
      },
      () => { // alternierend zwei Regeln
        const add = randInt(2, 9), sub = randInt(1, add - 1);
        const arr = [randInt(5, 20)];
        for (let i = 0; i < 4; i++) arr.push(i % 2 === 0 ? arr.at(-1) + add : arr.at(-1) - sub);
        return { arr, explain: `Abwechselnd +${add} und −${sub}.` };
      },
      () => { // ×2 dann +k
        const k = randInt(1, 5);
        const arr = [randInt(1, 6)];
        for (let i = 0; i < 4; i++) arr.push(arr.at(-1) * 2 + k);
        return { arr, explain: `Regel: verdoppeln und dann +${k}.` };
      },
    ],
    'experte': [
      () => { // zwei verschachtelte Reihen
        const s1 = randInt(1, 10), st1 = randInt(2, 6);
        const s2 = randInt(20, 40), st2 = randInt(3, 8);
        const arr = [];
        for (let i = 0; i < 3; i++) { arr.push(s1 + i * st1); arr.push(s2 - i * st2); }
        arr.pop();
        return { arr, explain: `Zwei verschachtelte Reihen: die 1., 3., 5. Zahl steigt um ${st1}; die 2., 4., 6. Zahl fällt um ${st2}.` };
      },
      () => { // n*faktor + wachsend
        const f = pick([2, 3]);
        let add = 1;
        const arr = [randInt(2, 6)];
        for (let i = 0; i < 4; i++) { arr.push(arr.at(-1) * f - add); add++; }
        return { arr, explain: `Regel: ×${f}, dann −1, −2, −3, … (wachsender Abzug).` };
      },
      () => { // Primzahlen
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
        const start = randInt(0, 8);
        const arr = primes.slice(start, start + 5);
        return { arr, explain: `Es sind aufeinanderfolgende Primzahlen.` };
      },
    ],
  };

  function seq(start, fn, len, explain) {
    const arr = [start];
    for (let i = 0; i < len; i++) arr.push(fn(arr.at(-1)));
    return { arr, explain };
  }

  const { arr, explain } = pick(gens[difficulty] || gens['mittel'])();
  const answer = arr.at(-1);
  const shown = arr.slice(0, -1);

  // Plausible falsche Optionen erzeugen
  const wrongs = new Set();
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.15));
  while (wrongs.size < 3) {
    const w = answer + pick([-1, 1]) * randInt(1, spread + 3);
    if (w !== answer) wrongs.add(w);
  }
  const options = shuffle([answer, ...wrongs]);

  return { shown, answer, options, correctIndex: options.indexOf(answer), explain };
}

export function renderLogik(container, difficulty, api) {
  const t = generate(difficulty);
  return multipleChoiceTask(container, api, {
    question: `${t.shown.join(', &nbsp;')}, &nbsp;<strong>?</strong>`,
    extraHtml: `<p style="text-align:center;color:var(--muted)">Welche Zahl setzt die Reihe logisch fort?</p>`,
    options: t.options.map(String),
    correctIndex: t.correctIndex,
    solutionHtml: `<p>Nächste Zahl: <strong>${t.answer}</strong></p><p>${t.explain}</p>`,
  });
}
