// ===== Text-Training: Finde das falsch geschriebene Wort im Satz =====
import { pick, randInt, escapeHtml } from '../core.js';

// Jeder Eintrag: Satz (Wörter korrekt) + Map von möglichen Fehlschreibungen.
const SENTENCES = {
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

function generate(difficulty) {
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
    <p class="task-question">In diesem Satz versteckt sich <strong>ein Rechtschreibfehler</strong>. Klicke auf das falsche Wort!</p>
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
        feedback.innerHTML = `✅ Genau! Richtig heißt es: <strong>${escapeHtml(t.correctWord)}</strong>`;
        feedback.className = 'feedback ok';
        api.finish(true);
      } else {
        el.classList.add('wrong');
        markCorrect();
        feedback.innerHTML = `❌ Das Wort war richtig geschrieben. Der Fehler war: <strong>${escapeHtml(t.wrongWord)}</strong> → <strong>${escapeHtml(t.correctWord)}</strong>`;
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
        `<div class="solution-box"><h4>💡 Lösung</h4><p>Falsch geschrieben: <strong>${escapeHtml(t.wrongWord)}</strong> – richtig ist: <strong>${escapeHtml(t.correctWord)}</strong></p></div>`;
    },
  };
}
