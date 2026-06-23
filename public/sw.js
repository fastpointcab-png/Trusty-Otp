const CACHE_NAME = "taxi-otp-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/images/TRUSTY OTP LOGO.png",
  "/manifest.json"
];

// Installs the service worker and caches core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Failed to cache initial PWA assets: ", err);
      });
    })
  );
  self.skipWaiting();
});

// Activates the service worker and cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-falling-back-to-cache strategy for assets
self.addEventListener("fetch", (event) => {
  // Only intercept HTTP/S requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, update the cache
        if (response && response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If neither works, return standard fallback or empty
          return new Response("Network connection unavailable", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
  );
});
