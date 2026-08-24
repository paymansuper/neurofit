// ===== NeuroFit Service Worker: Offline-Fähigkeit für die PWA =====
const CACHE = 'neurofit-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './css/style.css',
  './js/app.js',
  './js/core.js',
  './js/i18n.js',
  './js/gameshell.js',
  './js/adventure.js',
  './js/daily.js',
  './js/effects.js',
  './js/renderers.js',
  './js/games/sudoku.js',
  './js/games/rechnen.js',
  './js/games/logik.js',
  './js/games/merken.js',
  './js/games/worte.js',
  './js/games/tabellen.js',
  './js/games/text.js',
  './js/games/stroop.js',
  './js/games/memorypaare.js',
  './js/games/waage.js',
  './js/games/wortgitter.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first mit Cache-Fallback: Updates kommen an, offline geht trotzdem alles.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
