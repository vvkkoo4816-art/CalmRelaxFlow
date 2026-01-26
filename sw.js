
const CACHE_NAME = 'calm-relax-flow-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon1.apk',
  '/cloud.mp3',
  '/cloud2.mp3',
  '/cloud3.mp3',
  '/cmusic.mp3',
  '/cmusic2.mp3',
  '/forest2.mp3',
  '/healing.mp3',
  '/hill.mp3',
  '/light.mp3',
  '/morning.mp3',
  '/rain.mp3',
  '/sleep.mp3',
  '/water.mp3',
  '/zen.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Sanctuary installation v7 in progress...');
      // We use addAll for core assets, but wrap in a try-catch pattern if needed for robustness
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some assets failed to cache during install, sanctuary will retry on fetch:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old sanctuary cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      
      return fetch(event.request).then(fetchRes => {
        // Optional: Cache new successful requests on the fly
        if (fetchRes.status === 200 && ASSETS_TO_CACHE.some(path => event.request.url.includes(path))) {
          const resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return fetchRes;
      }).catch(err => {
        console.error('Fetch failed for resonance:', event.request.url);
        throw err;
      });
    })
  );
});
