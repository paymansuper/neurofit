// ===== NeuroFit Core: Profil, Skillrating (Elo), Persistenz =====
// Keine personenbezogenen Daten – nur Altersgruppe & Spielstatistiken im localStorage.

const STORAGE_KEY = 'neurofit-profile-v1';

export const DIFFICULTIES = [
  { id: 'sehr-leicht', label: 'Sehr leicht', elo: 700 },
  { id: 'leicht',      label: 'Leicht',      elo: 950 },
  { id: 'mittel',      label: 'Mittel',      elo: 1200 },
  { id: 'schwer',      label: 'Schwer',      elo: 1450 },
  { id: 'experte',     label: 'Experte',     elo: 1700 },
];

export const AGE_GROUPS = [
  { id: 'kind',    label: '6–12 Jahre',  emoji: '🧒', defaultDiff: 'sehr-leicht' },
  { id: 'jugend',  label: '13–17 Jahre', emoji: '🧑', defaultDiff: 'leicht' },
  { id: 'erwachsen', label: '18–59 Jahre', emoji: '🧑‍💼', defaultDiff: 'mittel' },
  { id: 'senior',  label: '60+ Jahre',   emoji: '🧓', defaultDiff: 'leicht' },
];

export const CATEGORIES = [
  { id: 'gedaechtnis', name: 'Gedächtnis',        emoji: '🧠' },
  { id: 'zahlen',      name: 'Zahlen & Logik',    emoji: '🔢' },
  { id: 'sprache',     name: 'Sprache',           emoji: '🔤' },
  { id: 'wahrnehmung', name: 'Wahrnehmung & Tempo', emoji: '👁️' },
  { id: 'alltag',      name: 'Alltag & Daten',    emoji: '📊' },
];

export const GAMES = [
  { id: 'merken',   cat: 'gedaechtnis', name: 'Merkspiel',     icon: '🧠', desc: 'Präge dir Zahlen- und Symbolfolgen ein und gib sie aus dem Gedächtnis wieder.' },
  { id: 'memory',   cat: 'gedaechtnis', name: 'Paare finden',  icon: '🃏', desc: 'Das klassische Memory: Decke Karten auf und finde alle Paare mit möglichst wenigen Fehlversuchen.' },
  { id: 'sudoku',   cat: 'zahlen', name: 'Sudoku',        icon: '🔢', desc: 'Der Klassiker: Fülle das Raster so, dass jede Zahl nur einmal pro Zeile, Spalte und Block vorkommt.' },
  { id: 'rechnen',  cat: 'zahlen', name: 'Kopfrechnen',   icon: '➗', desc: 'Trainiere dein Zahlenverständnis mit frisch generierten Rechenaufgaben.' },
  { id: 'logik',    cat: 'zahlen', name: 'Logik-Reihen',  icon: '🧩', desc: 'Erkenne das Muster und finde die nächste Zahl in der Reihe.' },
  { id: 'waage',    cat: 'zahlen', name: 'Waage-Rätsel',  icon: '⚖️', desc: 'Knacke Emoji-Gleichungen: Was wiegt der Apfel, wenn zwei Birnen sechs ergeben?' },
  { id: 'worte',    cat: 'sprache', name: 'Wortspiele',    icon: '🔤', desc: 'Entwirre Buchstabensalate und finde das gesuchte Wort.' },
  { id: 'wortgitter', cat: 'sprache', name: 'Wortgitter',  icon: '🔠', desc: 'Suchbild für Wörter: Finde das versteckte Wort im Buchstabenraster.' },
  { id: 'text',     cat: 'sprache', name: 'Text-Training', icon: '📝', desc: 'Finde Rechtschreibfehler und trainiere dein Sprachgefühl – wie im Textverarbeitungs-Alltag.' },
  { id: 'stroop',   cat: 'wahrnehmung', name: 'Farb-Wort-Test', icon: '🎨', desc: 'Das Wort sagt ROT, die Farbe ist blau – klicke richtig! Trainiert Konzentration und Impulskontrolle.' },
  { id: 'tabellen', cat: 'alltag', name: 'Tabellen-Denken', icon: '📊', desc: 'Alltagsnahe Excel-Aufgaben: Summen, Mittelwerte und Auswertungen im Kopf.' },
];

const START_ELO = 1000;

// ===== Abenteuer-Modus: Ränge & Charaktere =====
export const RANKS = [
  { xp: 0,    name: 'Frischling',       emoji: '🌱' },
  { xp: 100,  name: 'Denk-Azubi',       emoji: '📘' },
  { xp: 250,  name: 'Rätselscout',      emoji: '🔍' },
  { xp: 450,  name: 'Zahlenjäger',      emoji: '🏹' },
  { xp: 700,  name: 'Logikritter',      emoji: '🛡️' },
  { xp: 1000, name: 'Gedächtnisheld',   emoji: '🦸' },
  { xp: 1400, name: 'Wortmagier',       emoji: '🪄' },
  { xp: 1900, name: 'Denkmeister',      emoji: '🎓' },
  { xp: 2500, name: 'Gehirn-Champion',  emoji: '🏆' },
  { xp: 3200, name: 'NeuroLegende',     emoji: '👑' },
];

export const CHARACTERS = [
  { id: 'neuro',  emoji: '🧠', name: 'Neuro',          unlockRank: 0 },
  { id: 'fuchs',  emoji: '🦊', name: 'Fibo der Fuchs', unlockRank: 2 },
  { id: 'eule',   emoji: '🦉', name: 'Professor Eule', unlockRank: 4 },
  { id: 'delfin', emoji: '🐬', name: 'Delfina',        unlockRank: 6 },
  { id: 'drache', emoji: '🐲', name: 'Drako',          unlockRank: 8 },
  { id: 'krone',  emoji: '🤴', name: 'Der Denkkönig',  unlockRank: 9 },
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
  { id: 'erste-schritte', emoji: '👣', name: 'Erste Schritte',    desc: 'Löse deine erste Aufgabe richtig',            check: p => totalSolved(p) >= 1 },
  { id: 'zehn',           emoji: '🔟', name: 'Warmgelaufen',      desc: 'Löse 10 Aufgaben richtig',                    check: p => totalSolved(p) >= 10 },
  { id: 'hundert',        emoji: '💯', name: 'Hunderter-Club',    desc: 'Löse 100 Aufgaben richtig',                   check: p => totalSolved(p) >= 100 },
  { id: 'fuenfhundert',   emoji: '🚀', name: 'Denk-Maschine',     desc: 'Löse 500 Aufgaben richtig',                   check: p => totalSolved(p) >= 500 },
  { id: 'serie-5',        emoji: '🔥', name: 'Lauffeuer',         desc: '5 richtige Antworten in Folge (eine Übung)',  check: p => Object.values(p.ratings).some(r => r.bestStreak >= 5) },
  { id: 'serie-15',       emoji: '☄️', name: 'Unaufhaltsam',      desc: '15 richtige Antworten in Folge',              check: p => Object.values(p.ratings).some(r => r.bestStreak >= 15) },
  { id: 'allrounder',     emoji: '🎪', name: 'Allrounder',        desc: 'Spiele jede Übungskategorie mindestens einmal', check: p => Object.values(p.ratings).every(r => r.played >= 1) },
  { id: 'profi',          emoji: '⭐', name: 'Profi-Denker',      desc: 'Erreiche 1350 Skillrating in einer Kategorie', check: p => Object.values(p.ratings).some(r => r.elo >= 1350) },
  { id: 'meister',        emoji: '🏆', name: 'Kategorien-Meister', desc: 'Erreiche 1600 Skillrating in einer Kategorie', check: p => Object.values(p.ratings).some(r => r.elo >= 1600) },
  { id: 'boss-1',         emoji: '🏰', name: 'Bossjäger',         desc: 'Besiege deinen ersten Boss im Abenteuer',     check: p => bossesBeaten(p) >= 1 },
  { id: 'alle-bosse',     emoji: '🐲', name: 'Weltenbezwinger',   desc: 'Besiege die Bosse aller 5 Welten',            check: p => bossesBeaten(p) >= 5 },
  { id: 'welt-perfekt',   emoji: '🌟', name: 'Perfektionist',     desc: 'Hole alle 18 Sterne in einer Welt',           check: p => perfectWorlds(p) >= 1 },
  { id: 'sterne-45',      emoji: '✨', name: 'Sternensammler',    desc: 'Sammle 45 Sterne im Abenteuer',               check: p => totalAdvStars(p) >= 45 },
  { id: 'streak-3',       emoji: '📅', name: 'Dranbleiber',       desc: '3 Tage in Folge die Tages-Challenge schaffen', check: p => p.dailyStreak.best >= 3 },
  { id: 'streak-7',       emoji: '🗓️', name: 'Wochen-Held',       desc: '7 Tage in Folge die Tages-Challenge schaffen', check: p => p.dailyStreak.best >= 7 },
  { id: 'streak-30',      emoji: '🏵️', name: 'Eiserne Routine',   desc: '30 Tage in Folge die Tages-Challenge schaffen', check: p => p.dailyStreak.best >= 30 },
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
  if (elo < 850) return { name: 'Einsteiger', emoji: '🌱' };
  if (elo < 1100) return { name: 'Fortgeschritten', emoji: '🌿' };
  if (elo < 1350) return { name: 'Geübt', emoji: '🌳' };
  if (elo < 1600) return { name: 'Profi', emoji: '⭐' };
  return { name: 'Meister', emoji: '🏆' };
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
