// Khata service worker — caches the app shell (HTML/manifest/icons) so the
// app opens instantly and still loads if there's no signal. Firestore's own
// SDK handles its own offline queuing for data; this only covers the shell.
const CACHE_NAME = 'khata-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Shell files: cache-first (fast, works offline).
// Everything else (Firebase, fonts, Chart.js, Firestore calls): network-first,
// so data is always fresh when online and we never serve a stale API response.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isShellFile = SHELL_FILES.some(f => url.pathname.endsWith(f.replace('./', '/')));

  if (isShellFile) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
