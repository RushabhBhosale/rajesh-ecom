const CACHE_VERSION = "rr-pwa-v2-20260211";
const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-180.png",
  "/pwa-icon-512.png",
  "/pwa-icon-maskable.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Let API and external requests pass through.
  if (!isSameOrigin || url.pathname.startsWith("/api")) return;

  // Navigation: network-first with cached page fallback, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        try {
          const network = await fetch(request);
          if (network && network.ok) {
            cache.put(request, network.clone());
          }
          return network;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) return cached;
          return (await cache.match("/offline")) || (await cache.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Static/assets: cache-first, then network, backfill cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cloned = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
