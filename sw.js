// Service Worker mínimo requerido por pwacompat
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    // No hacer nada especial, pwacompat maneja el cache
    event.respondWith(fetch(event.request));
});
