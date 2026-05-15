// GlobalVet México — Service Worker
// Cache offline básico de la shell de la app

const CACHE_NAME = 'globalvet-v5';
const PRECACHE_URLS = [
  './manifest.json'
];

// Install: pre-cachear solo lo esencial (no el HTML para evitar cache vieja)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(){
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate: limpiar caches antiguos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: estrategia distinta para HTML vs resto
// - HTML: SIEMPRE network first (para que no quede cacheada una versión vieja)
// - Otros recursos: cache first con fallback a network
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // No tocar llamadas a APIs externas (Firebase, Stripe, etc.)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('stripe') ||
      url.hostname.includes('emailjs') ||
      url.hostname.includes('newsdata') ||
      url.hostname.includes('railway') ||
      url.hostname.includes('whatsapp') ||
      url.hostname.includes('youtube') ||
      url.hostname.includes('vimeo')) {
    return;
  }

  if (event.request.method !== 'GET') return;

  // Para HTML/navegación: siempre intentar red primero
  const isHTML = event.request.mode === 'navigate' ||
                 url.pathname.endsWith('/') ||
                 url.pathname.endsWith('.html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        // Actualizar caché en background
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Sin red: del caché
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Otros recursos: cache first, network como fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
