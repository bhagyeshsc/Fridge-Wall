/*
 * The manifest can't be one static file. Its `start_url` has to be the
 * current `/w/<uuid>` (or `/` in local-only mode), or "Add to Home Screen"
 * would install an icon that silently opens a brand-new, empty household
 * instead of the one you were looking at when you installed it. Built at
 * runtime instead, and swapped in as a blob URL once the real URL is known
 * (see resolveWallId() in wallId.ts, which runs before this does).
 */

const ICONS = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
] as const

export function installManifest() {
  const path = window.location.pathname + window.location.search

  const manifest = {
    name: 'Family Fridge',
    short_name: 'Fridge',
    description: "The family's shared fridge door.",
    id: path,
    start_url: path,
    scope: '/',
    display: 'standalone',
    background_color: '#F4F1EA',
    theme_color: '#F4F1EA',
    icons: ICONS,
  }

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }),
  )

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  link.href = url
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // No install prompt and no offline shell, but the wall works fine.
    })
  }

  // This runs from a mount effect, well after the page's own 'load' event
  // has usually already fired, so waiting for 'load' here would mean the
  // listener is attached too late to ever see it.
  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
