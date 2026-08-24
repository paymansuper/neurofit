// ===== Text-Training: Finde das falsch geschriebene Wort im Satz =====
import { pick, randInt, escapeHtml } from '../core.js';
import { t as tr, getLang } from '../i18n.js';

// Jeder Eintrag: Satz (Wörter korrekt) + Map von möglichen Fehlschreibungen.
const SENTENCES_DE = {
  'sehr-leicht': [
    { words: ['Der', 'Hund', 'spielt', 'im', 'Garten'], errs: { Hund: 'Hunt', spielt: 'schpielt', Garten: 'Gahten' } },
    { words: ['Die', 'Sonne', 'scheint', 'am', 'Himmel'], errs: { Sonne: 'Sone', scheint: 'scheind', Himmel: 'Himel' } },
    { words: ['Wir', 'essen', 'heute', 'frisches', 'Brot'], errs: { essen: 'esen', heute: 'heude', Brot: 'Brod' } },
    { words: ['Das', 'Auto', 'fährt', 'sehr', 'schnell'], errs: { fährt: 'färt', schnell: 'schnel', Auto: 'Autto' } },
  ],
  'leicht': [
    { words: ['Meine', 'Schwester', 'liest', 'gerne', 'spannende', 'Bücher'], errs: { Schwester: 'Schwister', liest: 'ließt', spannende: 'spanende', Bücher: 'Bücha' } },
    { words: ['Im', 'Herbst', 'fallen', 'die', 'bunten', 'Blätter'], errs: { Herbst: 'Herpst', fallen: 'falen', Blätter: 'Bläter' } },
    { words: ['Der', 'Lehrer', 'erklärt', 'die', 'schwierige', 'Aufgabe'], errs: { erklärt: 'erklährt', schwierige: 'schwirige', Aufgabe: 'Aufgahbe' } },
    { words: ['Am', 'Wochenende', 'besuchen', 'wir', 'unsere', 'Großeltern'], errs: { Wochenende: 'Wochenende', besuchen: 'besuhen', Großeltern: 'Grosseltern' } },
  ],
  'mittel': [
    { words: ['Die', 'Mannschaft', 'gewann', 'das', 'entscheidende', 'Spiel', 'deutlich'], errs: { Mannschaft: 'Manschaft', entscheidende: 'entscheidene', deutlich: 'deutlig' } },
    { words: ['Der', 'Rhythmus', 'der', 'Musik', 'begeisterte', 'alle', 'Zuhörer'], errs: { Rhythmus: 'Rythmus', begeisterte: 'begeisderte', Zuhörer: 'Zuhöhrer' } },
    { words: ['Die', 'Bibliothek', 'öffnet', 'täglich', 'außer', 'sonntags'], errs: { Bibliothek: 'Biblothek', täglich: 'däglich', außer: 'ausser' } },
    { words: ['Er', 'interessiert', 'sich', 'für', 'moderne', 'Architektur'], errs: { interessiert: 'interesiert', Architektur: 'Achitektur', moderne: 'mohderne' } },
  ],
  'schwer': [
    { words: ['Die', 'Verhandlungen', 'wurden', 'aufgrund', 'unvorhergesehener', 'Ereignisse', 'verschoben'], errs: { aufgrund: 'auf Grund', unvorhergesehener: 'unvorhergesehner', Ereignisse: 'Ereignise' } },
    { words: ['Seine', 'Entscheidung', 'basierte', 'auf', 'gründlicher', 'Recherche'], errs: { basierte: 'bassierte', gründlicher: 'gründlichem', Recherche: 'Recherge' } },
    { words: ['Das', 'Komitee', 'diskutierte', 'stundenlang', 'über', 'die', 'Strategie'], errs: { Komitee: 'Kommitee', diskutierte: 'diskuttierte', Strategie: 'Stradegie' } },
    { words: ['Die', 'Atmosphäre', 'im', 'Konzertsaal', 'war', 'einzigartig'], errs: { Atmosphäre: 'Athmosphäre', Konzertsaal: 'Konzertsahl', einzigartig: 'einzigardig' } },
  ],
  'experte': [
    { words: ['Der', 'Rechtsanwalt', 'plädierte', 'für', 'einen', 'Kompromiss', 'zwischen', 'den', 'Parteien'], errs: { plädierte: 'plädirte', Kompromiss: 'Kompromis', Rechtsanwalt: 'Rechtsanwald' } },
    { words: ['Die', 'Renaissance', 'beeinflusste', 'Kunst', 'und', 'Wissenschaft', 'nachhaltig'], errs: { Renaissance: 'Renaissanse', beeinflusste: 'beeinflußte', nachhaltig: 'nachhalltig' } },
    { words: ['Ihre', 'Dissertation', 'behandelte', 'ein', 'interdisziplinäres', 'Phänomen'], errs: { Dissertation: 'Disertation', interdisziplinäres: 'interdisziplinäres', Phänomen: 'Phänomehn' } },
    { words: ['Der', 'Ingenieur', 'überprüfte', 'die', 'Statik', 'des', 'Brückenpfeilers'], errs: { Ingenieur: 'Ingenör', überprüfte: 'überprühfte', Brückenpfeilers: 'Brückenpfeihlers' } },
  ],
};

const SENTENCES_EN = {
  'sehr-leicht': [
    { words: ['The', 'dog', 'plays', 'in', 'the', 'garden'], errs: { dog: 'dogg', plays: 'plaies', garden: 'gardan' } },
    { words: ['The', 'sun', 'shines', 'in', 'the', 'sky'], errs: { sun: 'sunn', shines: 'shins', sky: 'skye' } },
    { words: ['We', 'eat', 'fresh', 'bread', 'today'], errs: { eat: 'eet', fresh: 'frech', bread: 'bred' } },
    { words: ['The', 'car', 'drives', 'very', 'fast'], errs: { drives: 'drivs', very: 'verry', fast: 'faast' } },
  ],
  'leicht': [
    { words: ['My', 'sister', 'likes', 'reading', 'exciting', 'books'], errs: { sister: 'sisster', reading: 'reeding', exciting: 'exiting', books: 'bookes' } },
    { words: ['In', 'autumn', 'the', 'colorful', 'leaves', 'fall'], errs: { autumn: 'autum', colorful: 'colorfull', leaves: 'leafes' } },
    { words: ['The', 'teacher', 'explains', 'the', 'difficult', 'exercise'], errs: { teacher: 'teacher', explains: 'explanes', difficult: 'dificult', exercise: 'exercize' } },
    { words: ['We', 'visit', 'our', 'grandparents', 'every', 'weekend'], errs: { visit: 'vissit', grandparents: 'grandparants', weekend: 'weekand' } },
  ],
  'mittel': [
    { words: ['The', 'team', 'clearly', 'won', 'the', 'decisive', 'match'], errs: { clearly: 'clearely', decisive: 'desicive', match: 'mach' } },
    { words: ['The', 'rhythm', 'of', 'the', 'music', 'delighted', 'the', 'audience'], errs: { rhythm: 'rythm', delighted: 'delited', audience: 'audiance' } },
    { words: ['The', 'library', 'opens', 'daily', 'except', 'Sundays'], errs: { library: 'libary', daily: 'dayly', except: 'exept' } },
    { words: ['He', 'is', 'interested', 'in', 'modern', 'architecture'], errs: { interested: 'intrested', modern: 'modren', architecture: 'architechture' } },
  ],
  'schwer': [
    { words: ['The', 'negotiations', 'were', 'postponed', 'due', 'to', 'unforeseen', 'events'], errs: { negotiations: 'negociations', postponed: 'postphoned', unforeseen: 'unforseen' } },
    { words: ['His', 'decision', 'was', 'based', 'on', 'thorough', 'research'], errs: { decision: 'desision', thorough: 'thorogh', research: 'reserch' } },
    { words: ['The', 'committee', 'discussed', 'the', 'strategy', 'for', 'hours'], errs: { committee: 'comittee', discussed: 'discused', strategy: 'stratergy' } },
    { words: ['The', 'atmosphere', 'in', 'the', 'concert', 'hall', 'was', 'unique'], errs: { atmosphere: 'athmosphere', concert: 'consert', unique: 'unieque' } },
  ],
  'experte': [
    { words: ['The', 'lawyer', 'argued', 'for', 'a', 'compromise', 'between', 'the', 'parties'], errs: { lawyer: 'lawer', compromise: 'compromize', argued: 'arguied' } },
    { words: ['The', 'Renaissance', 'permanently', 'influenced', 'art', 'and', 'science'], errs: { Renaissance: 'Renaissanse', permanently: 'permanentely', influenced: 'influensed' } },
    { words: ['Her', 'dissertation', 'addressed', 'an', 'interdisciplinary', 'phenomenon'], errs: { dissertation: 'disertation', addressed: 'adressed', phenomenon: 'phenomenom' } },
    { words: ['The', 'engineer', 'checked', 'the', 'statics', 'of', 'the', 'bridge', 'pillar'], errs: { engineer: 'engeneer', checked: 'cheked', pillar: 'piller' } },
  ],
};

function generate(difficulty) {
  const SENTENCES = getLang() === 'en' ? SENTENCES_EN : SENTENCES_DE;
  const s = pick(SENTENCES[difficulty] || SENTENCES['mittel']);
  // ein Fehlerwort wählen, dessen Fehlschreibung sich vom Original unterscheidet
  const candidates = Object.entries(s.errs).filter(([k, v]) => k !== v);
  const [correctWord, wrongWord] = pick(candidates);
  const idx = s.words.indexOf(correctWord);
  const shown = [...s.words];
  shown[idx] = wrongWord;
  return { shown, errorIndex: idx, correctWord, wrongWord };
}

export function renderText(container, difficulty, api) {
  const t = generate(difficulty);

  container.innerHTML = `
    <p class="task-question">${tr('text.instruction')}</p>
    <div class="text-passage" id="passage">
      ${t.shown.map((w, i) => `<span class="word-clickable" data-i="${i}">${escapeHtml(w)}</span>`).join(' ')}.
    </div>
    <div class="feedback" id="feedback"></div>
    <div id="solution-slot"></div>`;

  const feedback = container.querySelector('#feedback');
  container.querySelectorAll('.word-clickable').forEach(el => {
    el.addEventListener('click', () => {
      if (api.isFinished()) return;
      const i = Number(el.dataset.i);
      if (i === t.errorIndex) {
        el.classList.add('correct');
        feedback.innerHTML = tr('text.correctIs', { w: escapeHtml(t.correctWord) });
        feedback.className = 'feedback ok';
        api.finish(true);
      } else {
        el.classList.add('wrong');
        markCorrect();
        feedback.innerHTML = tr('text.wasCorrect', { wrong: escapeHtml(t.wrongWord), right: escapeHtml(t.correctWord) });
        feedback.className = 'feedback bad';
        api.finish(false);
      }
    });
  });

  function markCorrect() {
    const el = container.querySelector(`.word-clickable[data-i="${t.errorIndex}"]`);
    if (el) el.classList.add('correct');
  }

  return {
    showSolution() {
      markCorrect();
      container.querySelector('#solution-slot').innerHTML =
        `<div class="solution-box"><h4>${tr('shell.solution')}</h4><p>${tr('text.solution', { wrong: escapeHtml(t.wrongWord), right: escapeHtml(t.correctWord) })}</p></div>`;
    },
  };
}
