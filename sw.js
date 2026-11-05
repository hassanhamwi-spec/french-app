// Offline-first service worker. No offline page, no banners: the app is always served from the saved copy.
// To release a new version, change CACHE (e.g. fr-app-v2). The new version starts only after the app is closed,
// so a lesson is never interrupted.
var CACHE = 'fr-app-v2';
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
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
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
