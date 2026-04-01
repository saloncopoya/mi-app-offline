const CACHE_NAME = 'mi-blog-v1';

// Instalación: cachear archivos básicos
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

// Activación: limpiar caches viejos
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

// Interceptar TODAS las peticiones
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Estrategia: Cache First (primero cache, luego red)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Si está en cache, lo devuelve
                    console.log('[SW] Cache hit:', url);
                    return response;
                }
                
                // Si no está en cache, va a la red
                console.log('[SW] Fetching:', url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Guardar en cache para próxima vez
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[SW] Error fetch:', error);
                        // Si falla red y no hay cache, devolver página offline
                        return caches.match('/index.html');
                    });
            })
    );
});
