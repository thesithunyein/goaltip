/*
 * WDK Wallet Template — minimal, security-conscious service worker.
 *
 * Purpose: satisfy PWA installability (a SW with a fetch handler) and give the
 * app shell an offline-friendly cache — WITHOUT ever touching wallet state.
 *
 * Hard rule: this SW only ever caches immutable, content-hashed build assets
 * (/_next/static/*) and the public icons. It NEVER caches HTML navigations, API
 * routes, JSON-RPC, or any same-/cross-origin request that could carry wallet
 * data. The vault, keys, and balances live in the page (IndexedDB / the worklet)
 * and never pass through here.
 */
const CACHE = 'wdk-shell-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isImmutableAsset (url) {
  return url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
     /\.(png|svg|ico|woff2?)$/.test(url.pathname))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return // never touch writes

  const url = new URL(req.url)
  if (!isImmutableAsset(url)) return // pass through to network (no caching)

  // Cache-first for immutable build assets only.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
      )
    )
  )
})
