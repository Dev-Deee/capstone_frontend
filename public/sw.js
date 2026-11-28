/* Cadence service worker — hand-written, no build step.
 *
 * Caching is deliberately conservative:
 *  - Pages (navigations) always come from the network, so signed-in HTML is
 *    never served stale; when the network is down, a static offline page.
 *  - Next.js build assets (/_next/static, content-hashed and immutable) and
 *    the app icons are cache-first.
 *  - Everything else, including every API call (a different origin) and
 *    anything that isn't a GET, goes straight to the network untouched.
 *
 * Push: shows the notification the server sent ({ title, body, url }) and
 * opens / focuses Cadence at that URL when it's clicked.
 */
const VERSION = "v1";
const STATIC_CACHE = `cadence-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("cadence-") && k !== STATIC_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // the API and anything third-party
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          if (hit) return hit;
          return fetch(req).then((res) => {
            if (res.ok && res.type === "basic") cache.put(req, res.clone());
            return res;
          });
        })
      )
    );
  }
});

// ── Push ──────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Cadence";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: data.url || "/dashboard" },
    })
  );
});

// Only ever navigate within this site: the server's URL is mapped onto our own origin.
function targetUrl(raw) {
  try {
    const u = new URL(raw || "/dashboard", self.location.origin);
    return new URL(u.pathname + u.search + u.hash, self.location.origin).href;
  } catch (e) {
    return new URL("/dashboard", self.location.origin).href;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = targetUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        return open.focus().then((w) => (w && "navigate" in w ? w.navigate(url) : undefined)).catch(() => self.clients.openWindow(url));
      }
      return self.clients.openWindow(url);
    })
  );
});
