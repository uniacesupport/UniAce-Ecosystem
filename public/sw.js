// Service Worker for PWA compliance
const CACHE_NAME = 'uniace-hub-v3'; // Incremented version to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Network First strategy for HTML requests
  const acceptHeader = event.request.headers.get('accept');
  if (event.request.mode === 'navigate' || (acceptHeader && acceptHeader.includes('text/html'))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache First for other assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
