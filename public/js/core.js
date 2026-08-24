// ===== NeuroFit Core: Profil, Skillrating (Elo), Persistenz =====
// Keine personenbezogenen Daten – nur Altersgruppe & Spielstatistiken im localStorage.

const STORAGE_KEY = 'neurofit-profile-v1';

export const DIFFICULTIES = [
  { id: 'sehr-leicht', label: { de: 'Sehr leicht', en: 'Very easy' }, elo: 700 },
  { id: 'leicht',      label: { de: 'Leicht',      en: 'Easy' },      elo: 950 },
  { id: 'mittel',      label: { de: 'Mittel',      en: 'Medium' },    elo: 1200 },
  { id: 'schwer',      label: { de: 'Schwer',      en: 'Hard' },      elo: 1450 },
  { id: 'experte',     label: { de: 'Experte',     en: 'Expert' },    elo: 1700 },
];

export const AGE_GROUPS = [
  { id: 'kind',    label: { de: '6–12 Jahre',  en: '6–12 years' },  emoji: '🧒', defaultDiff: 'sehr-leicht' },
  { id: 'jugend',  label: { de: '13–17 Jahre', en: '13–17 years' }, emoji: '🧑', defaultDiff: 'leicht' },
  { id: 'erwachsen', label: { de: '18–59 Jahre', en: '18–59 years' }, emoji: '🧑‍💼', defaultDiff: 'mittel' },
  { id: 'senior',  label: { de: '60+ Jahre',   en: '60+ years' },   emoji: '🧓', defaultDiff: 'leicht' },
];

export const CATEGORIES = [
  { id: 'gedaechtnis', name: { de: 'Gedächtnis', en: 'Memory' },                    emoji: '🧠' },
  { id: 'zahlen',      name: { de: 'Zahlen & Logik', en: 'Numbers & Logic' },       emoji: '🔢' },
  { id: 'sprache',     name: { de: 'Sprache', en: 'Language' },                     emoji: '🔤' },
  { id: 'wahrnehmung', name: { de: 'Wahrnehmung & Tempo', en: 'Perception & Speed' }, emoji: '👁️' },
  { id: 'alltag',      name: { de: 'Alltag & Daten', en: 'Everyday & Data' },       emoji: '📊' },
];

export const GAMES = [
  { id: 'merken',   cat: 'gedaechtnis', icon: '🧠', name: { de: 'Merkspiel', en: 'Memory Sequence' },
    desc: { de: 'Präge dir Zahlen- und Symbolfolgen ein und gib sie aus dem Gedächtnis wieder.', en: 'Memorize sequences of digits and symbols, then recall them from memory.' } },
  { id: 'memory',   cat: 'gedaechtnis', icon: '🃏', name: { de: 'Paare finden', en: 'Matching Pairs' },
    desc: { de: 'Das klassische Memory: Decke Karten auf und finde alle Paare mit möglichst wenigen Fehlversuchen.', en: 'The classic concentration game: flip cards and find all pairs with as few misses as possible.' } },
  { id: 'sudoku',   cat: 'zahlen', icon: '🔢', name: { de: 'Sudoku', en: 'Sudoku' },
    desc: { de: 'Der Klassiker: Fülle das Raster so, dass jede Zahl nur einmal pro Zeile, Spalte und Block vorkommt.', en: 'The classic: fill the grid so every number appears only once per row, column and block.' } },
  { id: 'rechnen',  cat: 'zahlen', icon: '➗', name: { de: 'Kopfrechnen', en: 'Mental Math' },
    desc: { de: 'Trainiere dein Zahlenverständnis mit frisch generierten Rechenaufgaben.', en: 'Train your number sense with freshly generated arithmetic tasks.' } },
  { id: 'logik',    cat: 'zahlen', icon: '🧩', name: { de: 'Logik-Reihen', en: 'Logic Sequences' },
    desc: { de: 'Erkenne das Muster und finde die nächste Zahl in der Reihe.', en: 'Spot the pattern and find the next number in the sequence.' } },
  { id: 'waage',    cat: 'zahlen', icon: '⚖️', name: { de: 'Waage-Rätsel', en: 'Balance Puzzle' },
    desc: { de: 'Knacke Emoji-Gleichungen: Was wiegt der Apfel, wenn zwei Birnen sechs ergeben?', en: 'Crack emoji equations: what does the apple weigh if two pears make six?' } },
  { id: 'worte',    cat: 'sprache', icon: '🔤', name: { de: 'Wortspiele', en: 'Word Puzzles' },
    desc: { de: 'Entwirre Buchstabensalate und finde das gesuchte Wort.', en: 'Unscramble jumbled letters and find the hidden word.' } },
  { id: 'wortgitter', cat: 'sprache', icon: '🔠', name: { de: 'Wortgitter', en: 'Word Grid' },
    desc: { de: 'Suchbild für Wörter: Finde das versteckte Wort im Buchstabenraster.', en: 'A word search: find the hidden word in the letter grid.' } },
  { id: 'text',     cat: 'sprache', icon: '📝', name: { de: 'Text-Training', en: 'Text Training' },
    desc: { de: 'Finde Rechtschreibfehler und trainiere dein Sprachgefühl – wie im Textverarbeitungs-Alltag.', en: 'Find spelling mistakes and train your feel for language – just like everyday word processing.' } },
  { id: 'stroop',   cat: 'wahrnehmung', icon: '🎨', name: { de: 'Farb-Wort-Test', en: 'Color-Word Test' },
    desc: { de: 'Das Wort sagt ROT, die Farbe ist blau – klicke richtig! Trainiert Konzentration und Impulskontrolle.', en: 'The word says RED, the color is blue – click correctly! Trains focus and impulse control.' } },
  { id: 'tabellen', cat: 'alltag', icon: '📊', name: { de: 'Tabellen-Denken', en: 'Table Thinking' },
    desc: { de: 'Alltagsnahe Excel-Aufgaben: Summen, Mittelwerte und Auswertungen im Kopf.', en: 'Everyday spreadsheet tasks: sums, averages and analyses in your head.' } },
];

const START_ELO = 1000;

// ===== Abenteuer-Modus: Ränge & Charaktere =====
export const RANKS = [
  { xp: 0,    name: { de: 'Frischling', en: 'Rookie' },              emoji: '🌱' },
  { xp: 100,  name: { de: 'Denk-Azubi', en: 'Think Trainee' },       emoji: '📘' },
  { xp: 250,  name: { de: 'Rätselscout', en: 'Puzzle Scout' },       emoji: '🔍' },
  { xp: 450,  name: { de: 'Zahlenjäger', en: 'Number Hunter' },      emoji: '🏹' },
  { xp: 700,  name: { de: 'Logikritter', en: 'Logic Knight' },       emoji: '🛡️' },
  { xp: 1000, name: { de: 'Gedächtnisheld', en: 'Memory Hero' },     emoji: '🦸' },
  { xp: 1400, name: { de: 'Wortmagier', en: 'Word Wizard' },         emoji: '🪄' },
  { xp: 1900, name: { de: 'Denkmeister', en: 'Master Mind' },        emoji: '🎓' },
  { xp: 2500, name: { de: 'Gehirn-Champion', en: 'Brain Champion' }, emoji: '🏆' },
  { xp: 3200, name: { de: 'NeuroLegende', en: 'Neuro Legend' },      emoji: '👑' },
];

export const CHARACTERS = [
  { id: 'neuro',  emoji: '🧠', name: { de: 'Neuro', en: 'Neuro' },                   unlockRank: 0 },
  { id: 'fuchs',  emoji: '🦊', name: { de: 'Fibo der Fuchs', en: 'Fibo the Fox' },   unlockRank: 2 },
  { id: 'eule',   emoji: '🦉', name: { de: 'Professor Eule', en: 'Professor Owl' },  unlockRank: 4 },
  { id: 'delfin', emoji: '🐬', name: { de: 'Delfina', en: 'Delfina' },               unlockRank: 6 },
  { id: 'drache', emoji: '🐲', name: { de: 'Drako', en: 'Drako' },                   unlockRank: 8 },
  { id: 'krone',  emoji: '🤴', name: { de: 'Der Denkkönig', en: 'The Think King' },  unlockRank: 9 },
];

export function xpToRank(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) idx = i;
  }
  const rank = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  return { ...rank, index: idx, next, progress: next ? (xp - rank.xp) / (next.xp - rank.xp) : 1 };
}

// ===== Achievements (Abzeichen) =====
function totalSolved(p) { return Object.values(p.ratings).reduce((a, r) => a + r.solved, 0); }
function totalAdvStars(p) { return Object.values(p.adventure.levels).reduce((a, b) => a + b, 0); }
function bossesBeaten(p) {
  let n = 0;
  for (let w = 0; w < 5; w++) if ((p.adventure.levels[`${w}-6`] || 0) > 0) n++;
  return n;
}
function perfectWorlds(p) {
  let n = 0;
  for (let w = 0; w < 5; w++) {
    let stars = 0;
    for (let l = 1; l <= 6; l++) stars += p.adventure.levels[`${w}-${l}`] || 0;
    if (stars === 18) n++;
  }
  return n;
}

export const ACHIEVEMENTS = [
  { id: 'erste-schritte', emoji: '👣', name: { de: 'Erste Schritte', en: 'First Steps' },       desc: { de: 'Löse deine erste Aufgabe richtig', en: 'Solve your first task correctly' },                        check: p => totalSolved(p) >= 1 },
  { id: 'zehn',           emoji: '🔟', name: { de: 'Warmgelaufen', en: 'Warmed Up' },           desc: { de: 'Löse 10 Aufgaben richtig', en: 'Solve 10 tasks correctly' },                                       check: p => totalSolved(p) >= 10 },
  { id: 'hundert',        emoji: '💯', name: { de: 'Hunderter-Club', en: 'Century Club' },      desc: { de: 'Löse 100 Aufgaben richtig', en: 'Solve 100 tasks correctly' },                                     check: p => totalSolved(p) >= 100 },
  { id: 'fuenfhundert',   emoji: '🚀', name: { de: 'Denk-Maschine', en: 'Thinking Machine' },   desc: { de: 'Löse 500 Aufgaben richtig', en: 'Solve 500 tasks correctly' },                                     check: p => totalSolved(p) >= 500 },
  { id: 'serie-5',        emoji: '🔥', name: { de: 'Lauffeuer', en: 'Wildfire' },               desc: { de: '5 richtige Antworten in Folge (eine Übung)', en: '5 correct answers in a row (one exercise)' },     check: p => Object.values(p.ratings).some(r => r.bestStreak >= 5) },
  { id: 'serie-15',       emoji: '☄️', name: { de: 'Unaufhaltsam', en: 'Unstoppable' },         desc: { de: '15 richtige Antworten in Folge', en: '15 correct answers in a row' },                              check: p => Object.values(p.ratings).some(r => r.bestStreak >= 15) },
  { id: 'allrounder',     emoji: '🎪', name: { de: 'Allrounder', en: 'All-Rounder' },           desc: { de: 'Spiele jede Übungskategorie mindestens einmal', en: 'Play every exercise at least once' },          check: p => Object.values(p.ratings).every(r => r.played >= 1) },
  { id: 'profi',          emoji: '⭐', name: { de: 'Profi-Denker', en: 'Pro Thinker' },         desc: { de: 'Erreiche 1350 Skillrating in einer Kategorie', en: 'Reach a skill rating of 1350 in one exercise' }, check: p => Object.values(p.ratings).some(r => r.elo >= 1350) },
  { id: 'meister',        emoji: '🏆', name: { de: 'Kategorien-Meister', en: 'Category Master' }, desc: { de: 'Erreiche 1600 Skillrating in einer Kategorie', en: 'Reach a skill rating of 1600 in one exercise' }, check: p => Object.values(p.ratings).some(r => r.elo >= 1600) },
  { id: 'boss-1',         emoji: '🏰', name: { de: 'Bossjäger', en: 'Boss Hunter' },            desc: { de: 'Besiege deinen ersten Boss im Abenteuer', en: 'Beat your first boss in the adventure' },            check: p => bossesBeaten(p) >= 1 },
  { id: 'alle-bosse',     emoji: '🐲', name: { de: 'Weltenbezwinger', en: 'World Conqueror' },  desc: { de: 'Besiege die Bosse aller 5 Welten', en: 'Beat the bosses of all 5 worlds' },                        check: p => bossesBeaten(p) >= 5 },
  { id: 'welt-perfekt',   emoji: '🌟', name: { de: 'Perfektionist', en: 'Perfectionist' },      desc: { de: 'Hole alle 18 Sterne in einer Welt', en: 'Earn all 18 stars in one world' },                        check: p => perfectWorlds(p) >= 1 },
  { id: 'sterne-45',      emoji: '✨', name: { de: 'Sternensammler', en: 'Star Collector' },    desc: { de: 'Sammle 45 Sterne im Abenteuer', en: 'Collect 45 stars in the adventure' },                         check: p => totalAdvStars(p) >= 45 },
  { id: 'streak-3',       emoji: '📅', name: { de: 'Dranbleiber', en: 'Committed' },            desc: { de: '3 Tage in Folge die Tages-Challenge schaffen', en: 'Complete the daily challenge 3 days in a row' }, check: p => p.dailyStreak.best >= 3 },
  { id: 'streak-7',       emoji: '🗓️', name: { de: 'Wochen-Held', en: 'Week Hero' },            desc: { de: '7 Tage in Folge die Tages-Challenge schaffen', en: 'Complete the daily challenge 7 days in a row' }, check: p => p.dailyStreak.best >= 7 },
  { id: 'streak-30',      emoji: '🏵️', name: { de: 'Eiserne Routine', en: 'Iron Routine' },     desc: { de: '30 Tage in Folge die Tages-Challenge schaffen', en: 'Complete the daily challenge 30 days in a row' }, check: p => p.dailyStreak.best >= 30 },
];

/** Prüft alle Abzeichen und gibt neu freigeschaltete zurück. */
export function checkAchievements(profile) {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!profile.achievements[a.id] && a.check(profile)) {
      profile.achievements[a.id] = new Date().toISOString();
      unlocked.push(a);
    }
  }
  if (unlocked.length) saveProfile(profile);
  return unlocked;
}

// ===== Tages-Challenge & Tagesstreak =====
export function todayISO() { return new Date().toISOString().slice(0, 10); }

/** Deterministischer Zufall pro Tag – alle bekommen dieselben Kategorien. */
export function dailySeededRandom(dateStr) {
  let seed = 0;
  for (const c of dateStr) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Meldet die Tages-Challenge als geschafft und aktualisiert den Streak. */
export function completeDailyChallenge(profile) {
  const today = todayISO();
  if (profile.daily.doneDate === today) return false; // heute schon geschafft
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const s = profile.dailyStreak;
  s.current = (profile.daily.doneDate === yesterday) ? s.current + 1 : 1;
  s.best = Math.max(s.best, s.current);
  profile.daily.doneDate = today;
  saveProfile(profile);
  return true;
}

/** Aktueller Streak – bricht ab, wenn gestern verpasst wurde. */
export function currentDailyStreak(profile) {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (profile.daily.doneDate === today || profile.daily.doneDate === yesterday) {
    return profile.dailyStreak.current;
  }
  return 0;
}

function defaultProfile() {
  const ratings = {};
  for (const g of GAMES) {
    ratings[g.id] = { elo: START_ELO, played: 0, solved: 0, streak: 0, bestStreak: 0 };
  }
  return {
    ageGroup: null,
    theme: 'light',
    textSize: 'normal',
    ratings,
    totalPlayed: 0,
    lastPlayed: null,
    playDays: [], // ISO-Datumsliste für "Tage aktiv" (max. 365 Einträge)
    adventure: {
      xp: 0,
      character: 'neuro',
      levels: {}, // key "welt-level" → Sterne (1–3)
    },
    daily: { doneDate: null },
    dailyStreak: { current: 0, best: 0 },
    achievements: {}, // id → ISO-Datum der Freischaltung
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const p = { ...defaultProfile(), ...JSON.parse(raw) };
    // fehlende Spiele nachrüsten (bei Updates)
    for (const g of GAMES) {
      if (!p.ratings[g.id]) p.ratings[g.id] = { elo: START_ELO, played: 0, solved: 0, streak: 0, bestStreak: 0 };
    }
    if (!p.adventure) p.adventure = { xp: 0, character: 'neuro', levels: {} };
    if (!p.daily) p.daily = { doneDate: null };
    if (!p.dailyStreak) p.dailyStreak = { current: 0, best: 0 };
    if (!p.achievements) p.achievements = {};
    return p;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== Elo-Skillrating =====
// Aufgabe hat je nach Schwierigkeit ein "Gegner-Elo". Sieg/Niederlage passt das Spieler-Elo an.
export function updateRating(profile, gameId, difficultyId, won, usedSolution = false) {
  const r = profile.ratings[gameId];
  const diff = DIFFICULTIES.find(d => d.id === difficultyId) ?? DIFFICULTIES[2];
  const K = r.played < 15 ? 40 : 24; // schnellere Kalibrierung am Anfang
  const expected = 1 / (1 + 10 ** ((diff.elo - r.elo) / 400));
  // Lösung angeschaut = halber Punktabzug, zählt nicht als voller Sieg
  const score = usedSolution ? 0.25 : (won ? 1 : 0);
  const delta = Math.round(K * (score - expected));
  r.elo = Math.max(300, r.elo + delta);
  r.played++;
  if (won && !usedSolution) {
    r.solved++;
    r.streak++;
    r.bestStreak = Math.max(r.bestStreak, r.streak);
  } else {
    r.streak = 0;
  }
  profile.totalPlayed++;
  profile.lastPlayed = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  if (!profile.playDays.includes(today)) {
    profile.playDays.push(today);
    if (profile.playDays.length > 365) profile.playDays.shift();
  }
  saveProfile(profile);
  return delta;
}

export function eloToLevel(elo) {
  if (elo < 850) return { name: { de: 'Einsteiger', en: 'Beginner' }, emoji: '🌱' };
  if (elo < 1100) return { name: { de: 'Fortgeschritten', en: 'Improving' }, emoji: '🌿' };
  if (elo < 1350) return { name: { de: 'Geübt', en: 'Skilled' }, emoji: '🌳' };
  if (elo < 1600) return { name: { de: 'Profi', en: 'Pro' }, emoji: '⭐' };
  return { name: { de: 'Meister', en: 'Master' }, emoji: '🏆' };
}

// Empfohlene Schwierigkeit anhand Elo & Altersgruppe
export function recommendedDifficulty(profile, gameId) {
  const r = profile.ratings[gameId];
  if (r.played >= 3) {
    // nach ein paar Runden: an Elo orientieren
    let best = DIFFICULTIES[0];
    for (const d of DIFFICULTIES) {
      if (Math.abs(d.elo - r.elo) < Math.abs(best.elo - r.elo)) best = d;
    }
    return best.id;
  }
  const ag = AGE_GROUPS.find(a => a.id === profile.ageGroup);
  return ag ? ag.defaultDiff : 'mittel';
}

// ===== Zufalls-Helfer =====
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
