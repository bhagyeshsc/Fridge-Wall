/*
 * Runtime caching only, no build-time precache list (this project doesn't
 * use a bundler plugin for that, to keep the dependency count small). The
 * app shell gets cached the first time it's actually visited online, then
 * reused on reload, offline, or a flaky connection.
 */

// Bumped to v2 to drop caches poisoned by the API-caching bug fixed below.
const CACHE = 'family-fridge-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Never the API. That is the live wall, and the stale-while-revalidate
  // branch below would hand the app a cached household on its next refetch,
  // silently reverting whatever has happened since.
  //
  // This used to be safe by accident: the wall was fetched through a
  // Supabase RPC, which is a POST, and the guard above skipped it. Reading
  // the wall over GET brought it into scope.
  if (new URL(request.url).pathname.startsWith('/api/')) return

  // Navigations: try the network first, so a fresh deploy is seen right
  // away; fall back to whatever shell is cached if there's no connection.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((cached) => cached || fetch(request))),
    )
    return
  }

  // Everything else (JS, CSS, icons): serve from cache immediately if
  // present, and quietly refresh the cache in the background either way.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
