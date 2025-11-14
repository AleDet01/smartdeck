/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'smartdeck-v2'; // Incrementato per forzare refresh
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        // Use addAll with error handling for each URL
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[ServiceWorker] Failed to cache ${url}:`, err.message);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Install complete');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[ServiceWorker] Install failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) schemes (chrome-extension, etc)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip API requests (sempre network-first)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch(err => {
                console.warn('[ServiceWorker] Failed to cache:', event.request.url, err.message);
              });
            });

          return response;
        });
      })
  );
});
