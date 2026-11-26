const CACHE_NAME = 'omnitask-pwa-v2026-11-21-v110';
const OFFLINE_URL = './index.html';
const APP_SHELL = [
  './',
  './index.html',
  './privacy.html',
  './manifest.webmanifest',
  './icon.svg',
  './omnitask-icon-192.png?v=5',
  './omnitask-icon-512.png?v=5'
];

// Servicios externos que nunca se guardan en caché (Firebase de sincronización y feriados)
const NETWORK_ONLY_HOSTS = ['firebaseio.com', 'firebasedatabase.app', 'googleapis.com', 'gstatic.com', 'nager.at'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('omnitask-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (NETWORK_ONLY_HOSTS.some((host) => url.hostname.endsWith(host))) return;
  if (url.pathname.endsWith('/version.json')) return;

  // Páginas y accesos directos (?tab=...): red primero y, sin internet, copia guardada ignorando parámetros de búsqueda
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Archivos propios (íconos con ?v=2, manifest...): caché primero ignorando query string y actualización en segundo plano
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || networkFetch;
      })
    );
  }
});
