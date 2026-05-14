// GlobalVet México — Service Worker
// Cache offline básico de la shell de la app

const CACHE_NAME = 'globalvet-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: pre-cachear shell de la app
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(){
        // Si falla algún recurso (offline), no romper la instalación
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

// Fetch: estrategia "network first, fallback to cache"
// - Para Firebase, Google APIs, Stripe: SIEMPRE de la red (no cachear)
// - Para todo lo demás: red primero, cache como fallback
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // No cachear llamadas a APIs externas
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('stripe') ||
      url.hostname.includes('emailjs') ||
      url.hostname.includes('newsdata') ||
      url.hostname.includes('railway')) {
    return;
  }

  // GET requests only
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Si la respuesta es válida, actualizar caché
      if (response && response.status === 200 && response.type === 'basic') {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      // Si no hay red, devolver desde caché
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
