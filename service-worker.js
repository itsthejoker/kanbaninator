// Service Worker for Kanbaninator
const CACHE_NAME = 'kanbaninator-cache-v1';
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/static/styles.css',
  '/static/app.js',
  '/static/joplin-integration.js',
  '/static/kanban-board.js',
  '/static/modal-manager.js',
  '/static/modal-animations.js',
  '/static/template-manager.js',
  '/static/utility-managers.js',
  '/static/accessibility.js',
  '/static/vendored/bootstrap.min.css',
  '/static/vendored/bootstrap.min.js',
  '/static/vendored/jkanban.min.css',
  '/static/vendored/jkanban.min.js',
  '/static/vendored/axios.min.js',
  '/static/vendored/dom-autoscroller.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip for API requests to Joplin
  if (event.request.url.includes('127.0.0.1')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }

        // Not in cache - fetch and cache the new request
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response since we need to use it twice
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});
