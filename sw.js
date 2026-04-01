const CACHE_NAME = 'blog-offline-v1';
const BLOG_URL = 'https://legadoavicola.blogspot.com/';

// Instalación
self.addEventListener('install', event => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando archivos iniciales');
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/manifest.json'
                ]);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación
self.addEventListener('activate', event => {
    console.log('[SW] Activado');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Si es la petición al blog, la cacheamos
    if (url.includes('blogspot.com') || url === BLOG_URL) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('[SW] Cache hit:', url);
                        return response;
                    }
                    
                    console.log('[SW] Fetching blog:', url);
                    return fetch(event.request)
                        .then(networkResponse => {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        })
                        .catch(error => {
                            console.log('[SW] Error, devolviendo index');
                            return caches.match('/index.html');
                        });
                })
        );
    } 
    // Para el resto de recursos
    else {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request).catch(() => {
                        return caches.match('/index.html');
                    });
                })
        );
    }
});
