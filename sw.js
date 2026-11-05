// Offline-first service worker. No offline page, no banners: the app is always served from the saved copy.
// To release a new version, change CACHE (e.g. fr-app-v8). The new version starts only after the app is closed,
// so a lesson is never interrupted.
var CACHE = 'fr-app-v8';
var FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './store.js',
  './voice.js',
  './ai.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png'
];

self.addEventListener('install', function (event) {
  // 'reload' skips the browser's HTTP cache, so a new version never saves OLD files (GitHub Pages caches files ~10 min)
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, { cache: 'reload' })).then(function (res) {
        if (!res.ok) throw new Error('precache ' + f + ' ' + res.status);
        return cache.put(f, res);
      });
    }));
  }));
});

self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();   // only when the user taps «update now»
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('fr-app-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.search.indexOf('ping=') >= 0) return;   // real connectivity checks must hit the network
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && url.pathname.indexOf('/voice/') < 0) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () {
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504 });
        });
    })
  );
});
