// ===== Tabellen-Denken: Excel-artige Auswertungsaufgaben =====
import { randInt, pick, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';

const SCENARIOS = [
  { title: 'Wochenmarkt-Verkäufe', rowLabel: 'Produkt', rows: ['Äpfel', 'Brot', 'Käse', 'Honig', 'Eier'], unit: '€' },
  { title: 'Schrittzähler der Woche', rowLabel: 'Tag', rows: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'], unit: 'Schritte' },
  { title: 'Vereinsmitglieder', rowLabel: 'Gruppe', rows: ['Fußball', 'Turnen', 'Schwimmen', 'Tennis', 'Schach'], unit: 'Personen' },
  { title: 'Monatsausgaben', rowLabel: 'Kategorie', rows: ['Lebensmittel', 'Fahrtkosten', 'Freizeit', 'Kleidung', 'Sonstiges'], unit: '€' },
];

const CONFIG = {
  'sehr-leicht': { rows: 3, min: 1, max: 10, tasks: ['sum', 'max'] },
  'leicht':      { rows: 3, min: 5, max: 50, tasks: ['sum', 'max', 'min'] },
  'mittel':      { rows: 4, min: 10, max: 200, tasks: ['sum', 'avg', 'diff'] },
  'schwer':      { rows: 5, min: 50, max: 900, tasks: ['avg', 'diff', 'pctshare'] },
  'experte':     { rows: 5, min: 100, max: 2500, tasks: ['avg', 'pctshare', 'growth'] },
};

function generate(difficulty) {
  const cfg = CONFIG[difficulty];
  const sc = pick(SCENARIOS);
  const rows = shuffle(sc.rows).slice(0, cfg.rows);
  let values = rows.map(() => randInt(cfg.min, cfg.max));
  const task = pick(cfg.tasks);

  const sum = values.reduce((a, b) => a + b, 0);

  let question, answer, explain;
  switch (task) {
    case 'sum':
      question = `Wie groß ist die <strong>Summe</strong> aller Werte?`;
      answer = sum;
      explain = `${values.join(' + ')} = ${sum} <em>(in Excel: =SUMME(B2:B${rows.length + 1}))</em>`;
      break;
    case 'max': {
      const m = Math.max(...values);
      question = `Welcher Wert ist der <strong>größte</strong>?`;
      answer = m;
      explain = `Der größte Wert ist ${m} (${rows[values.indexOf(m)]}). <em>(in Excel: =MAX(...))</em>`;
      break;
    }
    case 'min': {
      const m = Math.min(...values);
      question = `Welcher Wert ist der <strong>kleinste</strong>?`;
      answer = m;
      explain = `Der kleinste Wert ist ${m} (${rows[values.indexOf(m)]}). <em>(in Excel: =MIN(...))</em>`;
      break;
    }
    case 'avg': {
      // Werte so anpassen, dass der Durchschnitt ganzzahlig wird
      const target = randInt(cfg.min, cfg.max);
      const rest = target * values.length - values.slice(0, -1).reduce((a, b) => a + b, 0);
      if (rest >= 1) {
        values[values.length - 1] = rest;
      } else {
        values = values.map(() => target); // Fallback
      }
      const s = values.reduce((a, b) => a + b, 0);
      answer = s / values.length;
      question = `Wie groß ist der <strong>Durchschnitt</strong> (Mittelwert) aller Werte?`;
      explain = `Summe ${s} ÷ ${values.length} Werte = ${answer} <em>(in Excel: =MITTELWERT(...))</em>`;
      break;
    }
    case 'diff': {
      const max = Math.max(...values), min = Math.min(...values);
      answer = max - min;
      question = `Wie groß ist die <strong>Differenz</strong> zwischen dem größten und dem kleinsten Wert?`;
      explain = `${max} − ${min} = ${answer}`;
      break;
    }
    case 'pctshare': {
      // Einen Wert so setzen, dass er ein glatter Prozentanteil ist
      const pct = pick([10, 20, 25, 50]);
      const total = pick([200, 400, 500, 1000, 2000]);
      const share = (total * pct) / 100;
      const others = distribute(total - share, values.length - 1, cfg.min);
      values = shuffle([share, ...others]);
      const idx = values.indexOf(share);
      answer = pct;
      question = `Wie viel <strong>Prozent</strong> der Gesamtsumme (${total}) entfällt auf <strong>${rows[idx]}</strong>?`;
      explain = `${share} von ${total} = ${share} ÷ ${total} × 100 = ${pct} %`;
      break;
    }
    case 'growth':
    default: {
      const oldV = pick([200, 250, 400, 500, 800]);
      const pct = pick([10, 20, 25, 50]);
      const newV = oldV * (100 + pct) / 100;
      values[0] = oldV;
      values[1] = newV;
      answer = pct;
      question = `<strong>${rows[1]}</strong> ist von ${oldV} auf ${newV} gestiegen. Um wie viel <strong>Prozent</strong> ist der Wert gewachsen?`;
      explain = `(${newV} − ${oldV}) ÷ ${oldV} × 100 = ${pct} %`;
      break;
    }
  }

  return { sc, rows, values, question, answer, explain };
}

function distribute(total, parts, min) {
  const out = [];
  let rest = total;
  for (let i = 0; i < parts - 1; i++) {
    const maxTake = rest - min * (parts - 1 - i);
    const v = randInt(min, Math.max(min, maxTake));
    out.push(v);
    rest -= v;
  }
  out.push(Math.max(min, rest));
  return out;
}

export function renderTabellen(container, difficulty, api) {
  const t = generate(difficulty);
  const tableHtml = `
    <h3 style="text-align:center;margin-top:0.5rem">${t.sc.title}</h3>
    <table class="data-table">
      <thead><tr><th>${t.sc.rowLabel}</th><th>Wert (${t.sc.unit})</th></tr></thead>
      <tbody>${t.rows.map((r, i) => `<tr><td>${r}</td><td>${t.values[i]}</td></tr>`).join('')}</tbody>
    </table>`;

  container.innerHTML = tableHtml;
  const inner = document.createElement('div');
  container.appendChild(inner);

  return simpleInputTask(inner, api, {
    question: t.question,
    answer: String(t.answer),
    inputMode: 'numeric',
    solutionHtml: `<p><strong>${t.answer}</strong></p><p>${t.explain}</p>`,
  });
}
