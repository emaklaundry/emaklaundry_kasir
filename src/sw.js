import { precacheAndRoute } from 'workbox-precaching';

// Injected at build time by workbox (may be an empty array in dev)
precacheAndRoute(self.__WB_MANIFEST || []);

// Use version-based cache name to force cache invalidation on updates
const APP_VERSION = '2.3.0'; // ✅ UPDATED to match package.json
const CACHE_NAME = `laundry-management-v${APP_VERSION}-runtime`;

self.addEventListener('install', (event) => {
  // Force immediate activation of new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
          return Promise.resolve();
        }),
      );
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // CRITICAL: Never cache auth-related requests (prevents login issues)
  if (
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/login') ||
    (url.pathname === '/' && url.search.includes('auth')) ||
    url.hostname.includes('supabase.co')
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }),
    );
    return;
  }

  // Jangan cache API calls lainnya
  if (url.pathname.includes('/api/') || url.pathname.includes('/rest/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests (SPA) - network-first with fallback to precached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, res.clone());
          return res;
        } catch (err) {
          const cached = await caches.match('/index.html');
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // For JS and CSS: network-first to ensure fresh code (prevents stale cache issues)
  if (event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(
      (async () => {
        try {
          // Always try network first for code files
          const response = await fetch(event.request, {
            cache: 'no-cache', // Force revalidation
          });
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          // Fallback to cache only if offline
          const cached = await caches.match(event.request);
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // For images and fonts: cache-first is OK (they don't change often)
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        return response;
      } catch (err) {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })(),
  );
});
