const CACHE_NAME = 'mercey-aac-v1';

// All local assets that must be available immediately offline
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './audio/choo.mp3',
    './audio/maji.mp3',
    './audio/chakula.mp3',
    './audio/inatosha.mp3',
    './audio/ndiyo.mp3',
    './audio/hapana.mp3',
    './audio/nimechoka.mp3',
    './audio/asante.mp3',
    './audio/joto.mp3',
    './audio/baridi.mp3'
];

// Install event: Pre-cache local HTML and MP3 files
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching core assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
    );
});

// Activate event: Clean up old cache versions if the CACHE_NAME changes
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: Serve from cache first, fall back to network, and dynamically cache new items (like Iconify SVGs)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Return cached version if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, fetch from the network
            return fetch(event.request).then(networkResponse => {
                // Ensure the response is valid before dynamically caching it
                // We check for 'basic' (local) and 'cors' (external APIs like Iconify)
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }

                // Clone the response because the stream can only be consumed once
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    // Dynamically cache the external icons so they work offline next time
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(error => {
                console.error('Fetch failed; returning offline fallback.', error);
            });
        })
    );
});