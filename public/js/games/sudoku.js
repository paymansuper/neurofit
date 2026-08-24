// ===== Sudoku: Generator mit garantiert eindeutiger Lösung =====
// Sehr leicht: 4x4 · Leicht: 6x6 · Mittel/Schwer/Experte: 9x9 mit steigender Leere.
import { shuffle, randInt } from '../core.js';

const CONFIG = {
  'sehr-leicht': { size: 4, boxW: 2, boxH: 2, remove: 6 },
  'leicht':      { size: 6, boxW: 3, boxH: 2, remove: 16 },
  'mittel':      { size: 9, boxW: 3, boxH: 3, remove: 40 },
  'schwer':      { size: 9, boxW: 3, boxH: 3, remove: 50 },
  'experte':     { size: 9, boxW: 3, boxH: 3, remove: 56 },
};

function isValid(grid, size, boxW, boxH, row, col, num) {
  for (let i = 0; i < size; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / boxH) * boxH;
  const bc = Math.floor(col / boxW) * boxW;
  for (let r = br; r < br + boxH; r++) {
    for (let c = bc; c < bc + boxW; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function solve(grid, size, boxW, boxH, countSolutions = false, limit = 2) {
  let count = 0;
  function backtrack() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          const nums = countSolutions ? Array.from({ length: size }, (_, i) => i + 1)
                                      : shuffle(Array.from({ length: size }, (_, i) => i + 1));
          for (const n of nums) {
            if (isValid(grid, size, boxW, boxH, r, c, n)) {
              grid[r][c] = n;
              if (backtrack()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return !countSolutions || count >= limit;
  }
  backtrack();
  return countSolutions ? count : grid;
}

function generate(difficulty) {
  const { size, boxW, boxH, remove } = CONFIG[difficulty];
  const solution = Array.from({ length: size }, () => Array(size).fill(0));
  solve(solution, size, boxW, boxH);

  const puzzle = solution.map(r => [...r]);
  const cells = shuffle(Array.from({ length: size * size }, (_, i) => i));
  let removed = 0;
  for (const idx of cells) {
    if (removed >= remove) break;
    const r = Math.floor(idx / size), c = idx % size;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    // Eindeutigkeit prüfen
    const copy = puzzle.map(row => [...row]);
    if (solve(copy, size, boxW, boxH, true, 2) !== 1) {
      puzzle[r][c] = backup; // zurücknehmen, sonst mehrdeutig
    } else {
      removed++;
    }
  }
  return { puzzle, solution, size, boxW, boxH };
}

export function renderSudoku(container, difficulty, api) {
  // Generierung kurz verzögern, damit die Ladeanzeige gerendert wird (Experte kann rechnen)
  container.innerHTML = '<p class="task-question">⏳ Rätsel wird generiert…</p>';
  let inner = null;
  setTimeout(() => {
    if (container.isConnected) inner = buildSudoku(container, difficulty, api);
  }, 30);
  return { showSolution() { if (inner) inner.showSolution(); } };
}

function buildSudoku(container, difficulty, api) {
  const { puzzle, solution, size, boxW, boxH } = generate(difficulty);
  const user = puzzle.map(r => [...r]);
  let selected = null;

  container.innerHTML = `
    <p class="task-question">Fülle das Raster: Jede Zahl von 1–${size} darf pro Zeile, Spalte und Block nur einmal vorkommen.</p>
    <div class="sudoku-wrap"><div class="sudoku-grid size-${size}" role="grid" aria-label="Sudoku-Raster"></div></div>
    <div class="numpad" id="numpad"></div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const gridEl = container.querySelector('.sudoku-grid');
  const feedback = container.querySelector('#feedback');

  function draw() {
    gridEl.innerHTML = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('button');
        cell.className = 'sudoku-cell';
        cell.setAttribute('role', 'gridcell');
        if ((c + 1) % boxW === 0 && c !== size - 1) cell.classList.add('block-r');
        if ((r + 1) % boxH === 0 && r !== size - 1) cell.classList.add('block-b');
        if (puzzle[r][c] !== 0) {
          cell.classList.add('given');
          cell.textContent = puzzle[r][c];
        } else {
          cell.textContent = user[r][c] || '';
          if (selected && selected[0] === r && selected[1] === c) cell.classList.add('selected');
          cell.addEventListener('click', () => {
            if (api.isFinished()) return;
            selected = [r, c];
            draw();
          });
        }
        gridEl.appendChild(cell);
      }
    }
  }

  const numpad = container.querySelector('#numpad');
  for (let n = 1; n <= size; n++) {
    const b = document.createElement('button');
    b.textContent = n;
    b.addEventListener('click', () => setNum(n));
    numpad.appendChild(b);
  }
  const del = document.createElement('button');
  del.textContent = '⌫';
  del.setAttribute('aria-label', 'Löschen');
  del.addEventListener('click', () => setNum(0));
  numpad.appendChild(del);

  function setNum(n) {
    if (!selected || api.isFinished()) return;
    const [r, c] = selected;
    user[r][c] = n;
    draw();
    checkComplete();
  }

  const keyController = new AbortController();
  document.addEventListener('keydown', onKey, { signal: keyController.signal });
  function onKey(e) {
    if (!container.isConnected) { keyController.abort(); return; }
    if (e.target.matches('input, textarea, select')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= size) setNum(n);
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setNum(0);
  }

  function checkComplete() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (user[r][c] === 0) return;
      }
    }
    // alles gefüllt → prüfen
    let allOk = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (user[r][c] !== solution[r][c]) allOk = false;
      }
    }
    if (allOk) {
      feedback.textContent = '✅ Perfekt gelöst!';
      feedback.className = 'feedback ok';
      api.finish(true);
    } else {
      feedback.textContent = '❌ Es sind noch Fehler drin – falsche Felder sind markiert.';
      feedback.className = 'feedback bad';
      // Fehler markieren
      let i = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++, i++) {
          if (puzzle[r][c] === 0 && user[r][c] !== solution[r][c]) {
            gridEl.children[i].classList.add('error');
          }
        }
      }
    }
  }

  draw();

  return {
    showSolution() {
      let i = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++, i++) {
          if (puzzle[r][c] === 0) {
            gridEl.children[i].textContent = solution[r][c];
            gridEl.children[i].classList.add('solved-in');
          }
        }
      }
      container.querySelector('#solution-slot').innerHTML =
        `<div class="solution-box"><h4>💡 Lösung eingeblendet</h4><p>Die kursiv markierten Zahlen zeigen die richtige Lösung.</p></div>`;
    },
  };
}
