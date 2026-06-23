// Sypora AI Service Worker
// Network-first for pages, cache-first for static assets only

const CACHE_VERSION = "sypora-ai-v3";
const STATIC_CACHE  = "sypora-ai-static-v3";

// ── Install ────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  // Delete ALL old caches so stale HTML never gets served again
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== STATIC_CACHE)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch Strategy ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, API routes, and Next.js internals
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  // Static assets (images, icons) — cache-first is fine, they're versioned
  const isStaticAsset =
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages — ALWAYS network-first so deployments show immediately
  // Only fall back to cache if completely offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache HTML — always get fresh from network
        return response;
      })
      .catch(() => {
        // Offline fallback only
        return caches.match(request)
          .then((cached) => cached || caches.match("/offline") || caches.match("/"));
      })
  );
});

// ── Push Notifications ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body:    data.body    || "You have a new notification from Sypora AI",
    icon:    "/icons/icon-192.png",
    badge:   "/icons/icon-72.png",
    tag:     data.tag     || "sypora-ai-notification",
    renotify: true,
    data:    { url: data.url || "/dashboard" },
    actions: [
      { action: "open",    title: "Open Sypora" },
      { action: "dismiss", title: "Dismiss"     },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Sypora AI", options)
  );
});

// ── Notification Click ─────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
