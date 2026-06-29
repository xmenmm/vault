/* myVault service worker — makes the app installable and openable offline.
   It caches only public app-shell assets. It NEVER caches /api responses
   (encrypted vault data stays network-only) or cross-origin requests (e.g. the
   HaveIBeenPwned breach API), so nothing sensitive is written to the cache. */

const CACHE = 'myvault-v3';
const SHELL = ['/app', '/login', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave cross-origin (HIBP) alone
  if (url.pathname.startsWith('/api/')) return; // never cache vault data

  // Navigations: network-first so a new deploy is picked up, with the cached
  // shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/app')))
    );
    return;
  }

  // Static assets (hashed, immutable): stale-while-revalidate.
  if (url.pathname.startsWith('/_next/') || ['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
