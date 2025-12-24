import { precacheAndRoute } from 'workbox-precaching';

// Injected at build time by workbox (may be an empty array in dev)
precacheAndRoute(self.__WB_MANIFEST || []);

// Use version-based cache name to force cache invalidation on updates
const APP_VERSION = '2.5.0'; // ✅ UPDATED to match package.json
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

// Helper function to detect login-related requests
const isLoginRelatedRequest = (url, request) => {
  const pathname = url.pathname;

  // Explicitly login page
  if (pathname === '/login') {
    return true;
  }

  // For root path (/) - used by PWA start_url
  // Only treat as login page if no session cookie/auth header
  // This allows authenticated PWA to cache properly
  if (pathname === '/' || pathname === '/index.html') {
    // Check for session cookies or auth tokens
    const cookies = request.headers.get('Cookie') || '';
    const hasSession = cookies.includes('sb-') || cookies.includes('supabase');

    // If no session detected, treat as login page (don't cache)
    // If session exists, allow normal caching (for offline PWA)
    return !hasSession;
  }

  return false;
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

  // Navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Always fetch fresh from network with cache-busting for login/root
          const fetchOptions = isLoginRelatedRequest(url, event.request)
            ? {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  Pragma: 'no-cache',
                },
              }
            : {};

          const res = await fetch(event.request, fetchOptions);

          // Only cache authenticated app pages, NOT login page
          if (!isLoginRelatedRequest(url, event.request) && res && res.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, res.clone());
          }

          return res;
        } catch (err) {
          // For login page: NO cache fallback (must have network)
          if (isLoginRelatedRequest(url, event.request)) {
            return Response.error();
          }
          // For app pages: allow cache fallback for offline access
          const cached = await caches.match('/index.html');
          return cached || Response.error();
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
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
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
