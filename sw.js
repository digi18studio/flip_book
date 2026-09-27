/* Service Worker for 3D Flip Book by Digi18 STUDIOS (HS) */

const CACHE_NAME = 'flipbook-3d-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/audio.js',
  './js/pdf-engine.js',
  './js/flipbook-engine.js',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/page-flip.browser.js',
  './vendor/lucide.min.js',
  './assets/daria-yakovleva-wood-2045379_1920.jpg',
  './assets/north_studio-marble-2398946_1920.jpg',
  './assets/hellio42-ai-generated-8733501_1920.png',
  './assets/centrarredo-wall-2423815_1920.jpg',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first fallback to cache strategy for offline reading
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
