/* Custom service worker integrated via VitePWA (injectManifest)
   This file will be processed by the plugin which injects the precache manifest
   into `self.__WB_MANIFEST` at build time. It also contains your custom runtime
   caching logic migrated from the previous root-level `sw.js`.
*/

import { precacheAndRoute } from 'workbox-precaching';

// Injected at build time by workbox (may be an empty array in dev)
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'laundry-management-v1-runtime';

// Basic runtime caching logic for navigation & assets
self.addEventListener('install', (event) => {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Claim clients so the SW starts controlling pages immediately
    await self.clients.claim();
    // Optionally clear old caches here if needed
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => {
      if (name !== CACHE_NAME) return caches.delete(name);
      return Promise.resolve();
    }));
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Navigation requests (SPA) - network-first with fallback to precached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(event.request);
        // Optionally cache navigation responses
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
