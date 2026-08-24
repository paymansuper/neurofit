# 🧠 NeuroFit – Kostenloses Gehirnjogging für alle

NeuroFit ist eine kostenlose, quelloffene Gehirnjogging-Plattform für alle Altersklassen –
**ohne Anmeldung, ohne Tracking, ohne personenbezogene Daten**. Der gesamte Fortschritt
wird ausschließlich im `localStorage` des Browsers gespeichert.

## ✨ Features

- **📅 Tages-Challenge & Streak**
  - Jeden Tag 3 kurze Aufgaben (für alle Spieler dieselben Kategorien)
  - Tagesstreak 🔥 mit Bonus-XP – der stärkste Anreiz, täglich zu trainieren
- **🎖️ 16 Abzeichen (Achievements)** – von „Erste Schritte" bis „Eiserne Routine" (30-Tage-Streak), mit Konfetti & Toast bei Freischaltung
- **📱 PWA** – installierbar auf dem Homescreen, funktioniert komplett offline (Service Worker)
- **🗺️ Abenteuer-Modus** (wie ein Jump'n'Run!)
  - Wähle einen Helden und reise durch **5 Welten**: Zahlenwiese 🌼, Wörterwald 🌲, Logik-Gebirge ⛰️, Datensee 🌊, Neuro-Vulkan 🌋
  - 6 Level pro Welt (5 normale + 1 **Boss-Level** mit Sudoku), sammle **1–3 Sterne** pro Level
  - Verdiene **XP**, steige durch **10 Ränge** auf (Frischling 🌱 → NeuroLegende 👑)
  - Schalte **6 Charaktere** frei (Neuro 🧠, Fibo der Fuchs 🦊, Professor Eule 🦉 …)
- **11 Übungen in 5 Trainingsbereichen**
  - 🧠 **Gedächtnis**: Merkspiel (Zahlen- & Symbolfolgen) · Paare finden (Memory)
  - 🔢 **Zahlen & Logik**: Sudoku (4×4/6×6/9×9, eindeutige Lösung) · Kopfrechnen · Logik-Reihen · Waage-Rätsel (Emoji-Gleichungen)
  - 🔤 **Sprache**: Wortspiele (Anagramme) · Wortgitter (Wortsuche) · Text-Training (Rechtschreibfehler)
  - 👁️ **Wahrnehmung & Tempo**: Farb-Wort-Test (Stroop-Effekt)
  - 📊 **Alltag & Daten**: Tabellen-Denken (Excel-artige Auswertungen)
- **5 Schwierigkeitsgrade**: Sehr leicht · Leicht · Mittel · Schwer · Experte
- **Zufällig generierte Aufgaben** – keine Aufgabe gleicht der anderen
- **Lösung jederzeit einblendbar**, wenn man nicht weiterkommt (mit Erklärung)
- **Elo-basiertes Skillrating** pro Kategorie mit adaptiver Schwierigkeits-Empfehlung
- **Altersgruppen-Empfehlungen** (6–12, 13–17, 18–59, 60+) ohne Speicherung des genauen Alters
- **Barrierefreundlich**: Dunkelmodus, einstellbare Textgröße, Tastatursteuerung im Sudoku
- **100 % clientseitig** – kein Backend, keine Datenbank, kein Login

## 🚀 Lokal starten

Es wird kein Build-Schritt benötigt – einfach einen statischen Server starten:

```bash
npx serve public
# oder
python3 -m http.server 8000 --directory public
```

Dann `http://localhost:8000` öffnen.

## ☁️ Deployment auf GitHub Pages (empfohlen)

Das Repo enthält einen fertigen Workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)),
der bei jedem Push auf `main` automatisch den `public/`-Ordner veröffentlicht.

Einmalig aktivieren:

1. Repo auf GitHub pushen
2. Auf GitHub: **Settings → Pages → Source: „GitHub Actions"** wählen
3. Fertig – die App ist danach unter `https://<name>.github.io/<repo>/` erreichbar

Von dort können Nutzer NeuroFit direkt als **App installieren** (PWA):
Chrome/Edge zeigen ein Installieren-Symbol in der Adressleiste, auf dem iPhone
geht es über Teilen → „Zum Home-Bildschirm". Danach läuft die App offline.

## ☁️ Alternative: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # bestehende firebase.json übernehmen, public-Ordner: "public"
firebase deploy
```

## 🏗️ Architektur

```
public/
├── index.html          # Einstiegspunkt (SPA)
├── css/style.css       # Design-System mit Themes & Textgrößen
└── js/
    ├── core.js         # Profil, localStorage, Elo-Rating, Zufalls-Helfer
    ├── gameshell.js    # Gemeinsamer Spielrahmen (Schwierigkeit, Auswertung, Lösung)
    ├── app.js          # Router, Startseite, Statistik, Einstellungen
    ├── renderers.js    # Zentrale Zuordnung Spiel-ID → Renderer
    └── games/          # Ein Modul pro Übung
        ├── sudoku.js
        ├── rechnen.js
        ├── logik.js
        ├── merken.js
        ├── memorypaare.js
        ├── worte.js
        ├── wortgitter.js
        ├── waage.js
        ├── stroop.js
        ├── tabellen.js
        └── text.js
```

### Skillrating

Jede Kategorie hat ein eigenes Elo-Rating (Start: 1000). Jede Aufgabe hat je nach
Schwierigkeit ein „Gegner-Elo“ (700–1700). Bei richtiger Lösung steigt das Rating,
bei falscher sinkt es – gewichtet nach der erwarteten Gewinnwahrscheinlichkeit.
Wird die Lösung eingeblendet, zählt die Runde nur zu 25 %.

### Neue Übung hinzufügen (Contribution-Guide)

1. Neues Modul unter `public/js/games/` anlegen, das `render<Name>(container, difficulty, api)` exportiert.
2. In [core.js](public/js/core.js) das Spiel im `GAMES`-Array registrieren (inkl. Kategorie `cat`).
3. In [renderers.js](public/js/renderers.js) den Renderer in `RENDERERS` eintragen.
4. Die Datei in der `ASSETS`-Liste von [sw.js](public/sw.js) ergänzen und die Cache-Version hochzählen.
5. Die Helfer `simpleInputTask` / `multipleChoiceTask` aus `gameshell.js` nutzen oder eigenes UI bauen.

## 🔒 Datenschutz

- Keine Cookies, kein Tracking, keine Analytics
- Keine Server-Kommunikation außer dem Laden der statischen Dateien
- Fortschritt liegt nur im `localStorage` und kann jederzeit in den Einstellungen gelöscht werden

## 📄 Lizenz

MIT – siehe [LICENSE](LICENSE). Beiträge sind herzlich willkommen!
