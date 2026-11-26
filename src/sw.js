import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';

// Injected at build time by workbox (may be an empty array in dev)
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// The new SW waits until the user accepts the update (PWAUpdatePrompt posts SKIP_WAITING),
// so a cashier mid-transaction is never interrupted by an automatic reload.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Injected or fallback version to force runtime cache invalidation on updates
const APP_VERSION = typeof __SW_VERSION__ !== 'undefined' ? __SW_VERSION__ : '2.7.1';
const CACHE_NAME = `laundry-management-v${APP_VERSION}-runtime`;
const RUNTIME_CACHE_PREFIX = 'laundry-management-';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(RUNTIME_CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    })(),
  );
});

// Helper function to detect login-related requests
const isLoginRelatedRequest = (url) => url.pathname === '/login';

const cacheRuntimeResponse = async (request, response) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn('Failed to cache runtime response:', error);
  }
};

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // CRITICAL: Only intercept AUTHENTICATION requests, not all Supabase API calls
  // This prevents removing API keys from regular database queries
  if (
    url.hostname.includes('supabase.co') &&
    (url.pathname.includes('/auth/v1/') || // Supabase auth endpoints
      url.pathname.includes('/auth/callback') ||
      (url.pathname === '/' && url.search.includes('auth')))
  ) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Don't cache Supabase REST API calls (but let them pass through with headers intact)
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    // Let it pass through without caching, but DON'T modify headers
    event.respondWith(fetch(event.request));
    return;
  }

  // Don't cache other API calls
  if (url.pathname.includes('/api/') || url.pathname.includes('/rest/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests (HTML pages): network-first. Every route of this SPA serves the
  // same index.html, so offline we fall back to the single precached app shell instead of
  // keeping a copy per visited URL. This also covers /login: the shell contains no user
  // data, and showing the app (with its Offline badge) beats the browser's error page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fetchOptions = isLoginRelatedRequest(url) ? { cache: 'no-store' } : {};
          return await fetch(event.request, fetchOptions);
        } catch (err) {
          // Precache stores index.html under a revisioned key, so use matchPrecache.
          const shell = await matchPrecache('/index.html');
          return shell || Response.error();
        }
      })(),
    );
    return;
  }

  // For JS and CSS files
  if (event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(
      (async () => {
        try {
          // For login page assets: network-only, no cache
          const fetchOptions =
            event.request.referrer && new URL(event.request.referrer).pathname === '/login'
              ? { cache: 'no-store' }
              : { cache: 'no-cache' }; // Force revalidation for app assets

          const response = await fetch(event.request, fetchOptions);

          // Only cache app assets, not login page assets
          if (
            response &&
            response.status === 200 &&
            !(event.request.referrer && new URL(event.request.referrer).pathname === '/login')
          ) {
            await cacheRuntimeResponse(event.request, response);
          }

          return response;
        } catch (err) {
          // For login page: NO cache fallback
          if (event.request.referrer && new URL(event.request.referrer).pathname === '/login') {
            return Response.error();
          }
          // For app: allow cache fallback for offline
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
            await cacheRuntimeResponse(event.request, response);
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
