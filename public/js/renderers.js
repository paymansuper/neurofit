// ===== Zentrale Renderer-Zuordnung: Spiel-ID → Render-Funktion =====
// Neues Spiel? Hier registrieren + in GAMES (core.js) eintragen – fertig.
import { renderSudoku } from './games/sudoku.js';
import { renderRechnen } from './games/rechnen.js';
import { renderLogik } from './games/logik.js';
import { renderMerken } from './games/merken.js';
import { renderWorte } from './games/worte.js';
import { renderTabellen } from './games/tabellen.js';
import { renderText } from './games/text.js';
import { renderStroop } from './games/stroop.js';
import { renderMemory } from './games/memorypaare.js';
import { renderWaage } from './games/waage.js';
import { renderWortgitter } from './games/wortgitter.js';

export const RENDERERS = {
  sudoku: renderSudoku,
  rechnen: renderRechnen,
  logik: renderLogik,
  merken: renderMerken,
  worte: renderWorte,
  tabellen: renderTabellen,
  text: renderText,
  stroop: renderStroop,
  memory: renderMemory,
  waage: renderWaage,
  wortgitter: renderWortgitter,
};
