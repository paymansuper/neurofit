// ===== Wortspiele: Anagramme (Buchstabensalat) mit deutschen & englischen Wortlisten =====
import { pick, shuffle } from '../core.js';
import { simpleInputTask } from '../gameshell.js';
import { t, getLang } from '../i18n.js';

const WORDS_DE = {
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

const WORDS_EN = {
  'sehr-leicht': [
    'HOUSE','TREE','BALL','DOG','MOUSE','SUN','FLOWER','APPLE','TABLE','CHAIR',
    'BOOK','CAR','BIRD','FISH','BREAD','MILK','SHOE','HAND','HEAD','STAR',
  ],
  'leicht': [
    'GARDEN','SCHOOL','WINDOW','WINTER','SUMMER','FRIEND','THUNDER','CLOUD','STREET','COOKIE',
    'JACKET','MIRROR','PLATE','SPOON','LAMP','PILLOW','RAIN','MOUNTAIN','MEADOW','HONEY',
  ],
  'mittel': [
    'LIBRARY','BUTTERFLY','HOSPITAL','BICYCLE','MAGAZINE','TOOLBOX','BIRTHDAY','ADVENTURE','ORCHESTRA','LANDSCAPE',
    'MESSAGE','EXPERIENCE','PATIENCE','SCIENCE','MELODY','COMPASS','HORIZON','TREASURE','LIGHTHOUSE','WATERFALL',
  ],
  'schwer': [
    'ACCELERATION','RESPONSIBILITY','ENTERPRISE','DEVELOPMENT','JUSTIFICATION','ENTHUSIASM','CONCENTRATION','TOGETHERNESS','IMAGINATION','DECISION',
    'OPPORTUNITY','OBSERVATION','RESISTANCE','IMPROVEMENT','RECOGNITION','REMEMBRANCE','CONSIDERATION','NEGOTIATION','INVITATION','ENVIRONMENT',
  ],
  'experte': [
    'EXTRAORDINARY','INDEPENDENCE','PROBABILITY','CONFRONTATION','UNDERSTANDABLE','HISTORIOGRAPHY','VISUALIZATION','CHARACTERIZATION','COLLABORATION','CONTRADICTORY',
    'NEUROSCIENCE','CONSTITUTIONAL','RESURRECTION','POPULATION','EQUILIBRIUM','ORTHOGRAPHY','ARCHITECTURE','RELATIONSHIP','SOPHISTICATION','INSTANTANEOUS',
  ],
};

const HINTS = {
  'sehr-leicht': { de: 'Ein Wort aus dem Alltag.', en: 'An everyday word.' },
  'leicht': { de: 'Ein bekanntes Nomen.', en: 'A well-known noun.' },
  'mittel': { de: 'Ein längeres Wort.', en: 'A longer word.' },
  'schwer': { de: 'Ein abstraktes Nomen.', en: 'An abstract noun.' },
  'experte': { de: 'Ein sehr langes Wort (ä/ö/ü als ae/oe/ue).', en: 'A very long word.' },
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
  const lists = getLang() === 'en' ? WORDS_EN : WORDS_DE;
  const word = pick(lists[difficulty] || lists['mittel']);
  const jumbled = scrambled(word);

  return simpleInputTask(container, api, {
    question: `${t('worte.question')}<br><span style="letter-spacing:0.35rem;font-size:1.6rem">${jumbled}</span><br><small style="color:var(--muted);font-weight:400">${HINTS[difficulty][getLang()]}</small>`,
    answer: word,
    normalize: s => String(s).trim().toUpperCase()
      .replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS'),
    solutionHtml: `<p>${t('worte.solution', { w: word })}</p>`,
  });
}
