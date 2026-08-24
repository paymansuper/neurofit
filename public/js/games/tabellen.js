// ===== Tabellen-Denken: Excel-artige Auswertungsaufgaben =====
import { randInt, pick, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';
import { t as tr, L } from '../i18n.js';

const SCENARIOS = [
  { title: { de: 'Wochenmarkt-Verkäufe', en: 'Farmers Market Sales' }, rowLabel: { de: 'Produkt', en: 'Product' },
    rows: [ { de: 'Äpfel', en: 'Apples' }, { de: 'Brot', en: 'Bread' }, { de: 'Käse', en: 'Cheese' }, { de: 'Honig', en: 'Honey' }, { de: 'Eier', en: 'Eggs' } ], unit: { de: '€', en: '€' } },
  { title: { de: 'Schrittzähler der Woche', en: 'Step Counter This Week' }, rowLabel: { de: 'Tag', en: 'Day' },
    rows: [ { de: 'Montag', en: 'Monday' }, { de: 'Dienstag', en: 'Tuesday' }, { de: 'Mittwoch', en: 'Wednesday' }, { de: 'Donnerstag', en: 'Thursday' }, { de: 'Freitag', en: 'Friday' } ], unit: { de: 'Schritte', en: 'steps' } },
  { title: { de: 'Vereinsmitglieder', en: 'Club Members' }, rowLabel: { de: 'Gruppe', en: 'Group' },
    rows: [ { de: 'Fußball', en: 'Football' }, { de: 'Turnen', en: 'Gymnastics' }, { de: 'Schwimmen', en: 'Swimming' }, { de: 'Tennis', en: 'Tennis' }, { de: 'Schach', en: 'Chess' } ], unit: { de: 'Personen', en: 'people' } },
  { title: { de: 'Monatsausgaben', en: 'Monthly Expenses' }, rowLabel: { de: 'Kategorie', en: 'Category' },
    rows: [ { de: 'Lebensmittel', en: 'Groceries' }, { de: 'Fahrtkosten', en: 'Transport' }, { de: 'Freizeit', en: 'Leisure' }, { de: 'Kleidung', en: 'Clothing' }, { de: 'Sonstiges', en: 'Other' } ], unit: { de: '€', en: '€' } },
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
  const rows = shuffle(sc.rows).slice(0, cfg.rows).map(r => L(r));
  let values = rows.map(() => randInt(cfg.min, cfg.max));
  const task = pick(cfg.tasks);

  const sum = values.reduce((a, b) => a + b, 0);

  let question, answer, explain;
  switch (task) {
    case 'sum':
      question = tr('tab.sum');
      answer = sum;
      explain = tr('tab.exSum', { calc: `${values.join(' + ')} = ${sum}` });
      break;
    case 'max': {
      const m = Math.max(...values);
      question = tr('tab.max');
      answer = m;
      explain = tr('tab.exMax', { v: m, row: rows[values.indexOf(m)] });
      break;
    }
    case 'min': {
      const m = Math.min(...values);
      question = tr('tab.min');
      answer = m;
      explain = tr('tab.exMin', { v: m, row: rows[values.indexOf(m)] });
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
      question = tr('tab.avg');
      explain = tr('tab.exAvg', { s, n: values.length, a: answer });
      break;
    }
    case 'diff': {
      const max = Math.max(...values), min = Math.min(...values);
      answer = max - min;
      question = tr('tab.diff');
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
      question = tr('tab.pct', { total, row: rows[idx] });
      explain = `${share} ÷ ${total} × 100 = ${pct} %`;
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
      question = tr('tab.growth', { row: rows[1], old: oldV, new: newV });
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
    <h3 style="text-align:center;margin-top:0.5rem">${L(t.sc.title)}</h3>
    <table class="data-table">
      <thead><tr><th>${L(t.sc.rowLabel)}</th><th>${tr('tab.value', { u: L(t.sc.unit) })}</th></tr></thead>
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
