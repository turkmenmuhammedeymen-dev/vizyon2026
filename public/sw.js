const CACHE_NAME = 'vizyon-2026-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Kurulum
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Aktivasyon
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
