const CACHE_NAME = 'legado-avicola-v1';
const BLOG_URL = 'https://legadoavicola.blogspot.com/';

// URLs que queremos cachear inmediatamente
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos iniciales');
        return cache.addAll(urlsToCache);
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
          .map(key => {
            console.log('[SW] Eliminando cache viejo:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Tomando control de los clientes');
      return self.clients.claim();
    })
  );
});

// Interceptar TODAS las peticiones
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // ESTRATEGIA: Cache First (primero cache, luego red)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Si está en cache, lo devuelve
          console.log('[SW] ✅ Cache hit:', url);
          return response;
        }
        
        // Si no está en cache, va a la red
        console.log('[SW] 🌐 Fetching:', url);
        return fetch(event.request)
          .then(networkResponse => {
            // Verificar si es una respuesta válida
            if (networkResponse && networkResponse.status === 200) {
              // Guardar en cache para próxima vez
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('[SW] 💾 Guardado en cache:', url);
                });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] ❌ Error fetch:', error);
            
            // Si es la página del blog, intentar devolver la página de inicio cacheada
            if (url.includes('blogspot.com')) {
              return caches.match('/index.html');
            }
            
            // Si todo falla, devolver página offline
            return new Response(
              '<html><body><h1>📴 Sin conexión</h1><p>Conéctate a internet para ver el contenido actualizado.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
  );
});

// Sincronización en segundo plano (opcional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-blog') {
    console.log('[SW] Sincronizando blog...');
    event.waitUntil(
      fetch(BLOG_URL).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.put(BLOG_URL, response);
        });
      })
    );
  }
});
