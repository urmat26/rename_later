const CACHE = 'infodash-v1';
const URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/chart-setup.js',
  '/config.js',
  '/widgets/clock.js',
  '/widgets/weather.js',
  '/widgets/currency.js',
  '/widgets/news.js',
  '/widgets/crypto.js',
  '/widgets/github.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('Офлайн', {status: 503})))
  );
});
