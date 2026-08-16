/*
 * A household's identity is the URL, not a login.
 *
 * `/w/<uuid>` in the path is the shared secret: whoever holds that exact
 * link can read and write the wall. First visit with no id mints one and
 * rewrites the address bar; from then on, that resulting URL is what gets
 * shared with the rest of the family (and with your own other devices,
 * since opening the bare site again anywhere mints a *different* new wall).
 *
 * When an Android host is serving this, it redirects `/` to its own single
 * wall, so minting here is the exception rather than the rule.
 */

const PATH_PATTERN = /\/w\/([0-9a-f-]{36})(?:\/|$)/i

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

/*
 * crypto.randomUUID() is secure-context only, so it does not exist at all on
 * a wall served from http://192.168.x.x. crypto.getRandomValues() is not
 * gated the same way, so this builds a v4 from raw bytes instead of relying
 * on a helper that vanishes on exactly the setup we're targeting.
 */
function uuid4(): string {
  // Typed deliberately loosely. The DOM lib declares randomUUID as always
  // present, so a plain `in` check narrows crypto to `never` and the
  // fallback stops compiling. It genuinely is absent over http.
  const c = crypto as {
    randomUUID?: () => string
    getRandomValues: <T extends ArrayBufferView>(array: T) => T
  }

  if (typeof c.randomUUID === 'function') return c.randomUUID()

  const bytes = new Uint8Array(16)
  c.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

export function resolveWallId(): string {
  const match = window.location.pathname.match(PATH_PATTERN)
  if (match && isUuid(match[1])) {
    return match[1].toLowerCase()
  }

  const id = uuid4()
  const url = new URL(window.location.href)
  url.pathname = `/w/${id}`
  window.history.replaceState(null, '', url)
  return id
}
