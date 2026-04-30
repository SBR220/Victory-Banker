/* ═══════════════════════════════════════════════════
   Victory Banker — Service Worker (sw.js)
   Caches core assets for offline use.
   Version bump = forces cache refresh.
═══════════════════════════════════════════════════ */
const CACHE_NAME = 'vb-cache-v1';

/* Files to pre-cache on install */
const PRE_CACHE = [
  './Homepage_vB.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Mulish:wght@400;500;600;700&display=swap'
];

/* ── INSTALL: pre-cache core assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(PRE_CACHE);
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH: Network-first with cache fallback ── */
self.addEventListener('fetch', event => {
  /* Skip non-GET and chrome-extension requests */
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        /* Clone and cache fresh response */
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        /* Offline: serve from cache */
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          /* Fallback: return the main HTML page */
          return caches.match('./Homepage_vB.html');
        });
      })
  );
});
