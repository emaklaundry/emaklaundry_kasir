import { precacheAndRoute } from 'workbox-precaching';

// Injected at build time by workbox (may be an empty array in dev)
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'laundry-management-v1-runtime';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => {
      if (name !== CACHE_NAME) return caches.delete(name);
      return Promise.resolve();
    }));
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network First for Supabase API requests
  if (url.hostname.endsWith('supabase.co')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Navigation requests (SPA) - network-first with fallback to precached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, res.clone());
        return res;
      } catch (err) {
        const cached = await caches.match('/index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // For other requests, try cache first then network
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (!response || response.status !== 200) return response;
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
      return response;
    } catch (err) {
      return undefined;
    }
  })());
});
