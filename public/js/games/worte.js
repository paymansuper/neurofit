// ===== Wortspiele: Anagramme (Buchstabensalat) mit deutschen Wortlisten =====
import { pick, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';

const WORDS = {
  'sehr-leicht': [
    'HAUS','BAUM','BALL','HUND','MAUS','SONNE','BLUME','APFEL','TISCH','STUHL',
    'BUCH','AUTO','VOGEL','FISCH','BROT','MILCH','SCHUH','HAND','KOPF','STERN',
  ],
  'leicht': [
    'GARTEN','SCHULE','FENSTER','WINTER','SOMMER','FREUND','BLITZ','WOLKE','STRASSE','KUCHEN',
    'MANTEL','SPIEGEL','TELLER','GABEL','LAMPE','KISSEN','REGEN','BERGE','WIESE','HONIG',
  ],
  'mittel': [
    'BIBLIOTHEK','SCHMETTERLING','KRANKENHAUS','FAHRRADWEG','ZEITSCHRIFT','WERKZEUG','GEBURTSTAG','ABENTEUER','ORCHESTER','LANDSCHAFT',
    'NACHRICHT','ERFAHRUNG','GEDULD','WISSENSCHAFT','MELODIE','KOMPASS','HORIZONT','SCHATZKARTE','LEUCHTTURM','WASSERFALL',
  ],
  'schwer': [
    'GESCHWINDIGKEIT','VERANTWORTUNG','UNTERNEHMEN','ENTWICKLUNG','GERECHTIGKEIT','BEGEISTERUNG','AUFMERKSAMKEIT','ZUSAMMENHALT','VORSTELLUNG','ENTSCHEIDUNG',
    'GELEGENHEIT','BEOBACHTUNG','WIDERSTAND','VERBESSERUNG','ANERKENNUNG','ERINNERUNG','BETRACHTUNG','VERHANDLUNG','EINLADUNG','UMGEBUNG',
  ],
  'experte': [
    'DONAUDAMPFSCHIFF','UNABHAENGIGKEIT','WAHRSCHEINLICHKEIT','AUSEINANDERSETZUNG','SELBSTVERSTAENDLICH','GESCHICHTSSCHREIBUNG','VERANSCHAULICHUNG','CHARAKTERISIERUNG','ZUSAMMENARBEIT','WIDERSPRUECHLICH',
    'NATURWISSENSCHAFT','VERFASSUNGSGERICHT','AUFERSTEHUNG','BEVOELKERUNG','GLEICHGEWICHT','RECHTSCHREIBUNG','SEHENSWUERDIGKEIT','VERWANDTSCHAFT','FINGERSPITZENGEFUEHL','AUGENBLICKLICH',
  ],
};

const HINTS = {
  'sehr-leicht': 'Ein Wort aus dem Alltag.',
  'leicht': 'Ein bekanntes Nomen.',
  'mittel': 'Ein längeres deutsches Wort.',
  'schwer': 'Ein abstraktes Nomen.',
  'experte': 'Ein sehr langes deutsches Wort (ä/ö/ü als ae/oe/ue).',
};

function scrambled(word) {
  let s = word;
  let guard = 0;
  while (s === word && guard++ < 20) {
    s = shuffle(word.split('')).join('');
  }
  return s;
}

export function renderWorte(container, difficulty, api) {
  const word = pick(WORDS[difficulty] || WORDS['mittel']);
  const jumbled = scrambled(word);

  return simpleInputTask(container, api, {
    question: `Welches Wort versteckt sich hier?<br><span style="letter-spacing:0.35rem;font-size:1.6rem">${jumbled}</span><br><small style="color:var(--muted);font-weight:400">${HINTS[difficulty]}</small>`,
    answer: word,
    normalize: s => String(s).trim().toUpperCase()
      .replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS'),
    solutionHtml: `<p>Das gesuchte Wort ist: <strong>${word}</strong></p>`,
  });
}
