/*
 * The phone on the shelf.
 *
 * Three operations against the Android host: GET the wall, PUT it back with
 * the revision we last saw, and hold one websocket that stays silent until
 * somebody else writes. Everything is same-origin, because the host serves
 * this bundle itself, so there is no address to configure anywhere.
 *
 * The revision is the whole point of this backend over the hosted one. A
 * device that has been asleep and missed a broadcast wakes up holding a
 * stale wall; without the check its debounced save would write that stale
 * blob straight over everyone else's newer one. Here the host refuses it.
 */

import type { Backend, SaveResult, WallSnapshot } from '../backend'
import type { FridgeState } from '../types'

/** Aliased so the `fetch` method below can't be confused with the global. */
const http = window.fetch.bind(window)

const RECONNECT_MS = 2000

/*
 * This tab's identity, for exactly one purpose: so the host can leave us out
 * of the broadcast for our own write. An echo of your own change is not
 * harmless, because it would revert anything typed in the moment between the
 * save going out and the echo coming back.
 */
const CLIENT_ID = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`

function socketUrl(wallId: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/feed/${wallId}?client=${CLIENT_ID}`
}

export function createLocalBackend(): Backend {
  return {
    async fetch(wallId: string): Promise<WallSnapshot | null> {
      const res = await http(`/api/wall/${wallId}`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`could not read the wall (${res.status})`)
      return (await res.json()) as WallSnapshot
    },

    async save(wallId: string, state: FridgeState, rev: number): Promise<SaveResult> {
      // The body is the wall itself, not an envelope around it, and the
      // revision rides in the header. That way the host never has to parse
      // what it is storing: to it the wall is an opaque string.
      const res = await http(`/api/wall/${wallId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'if-match': String(rev),
          'x-fridge-client': CLIENT_ID,
        },
        body: JSON.stringify(state),
      })

      if (res.status === 409) {
        return { ok: false, conflict: (await res.json()) as WallSnapshot }
      }
      if (!res.ok) throw new Error(`could not save the wall (${res.status})`)

      const { rev: next } = (await res.json()) as { rev: number }
      return { ok: true, rev: next }
    },

    subscribe(wallId: string, onState: (snapshot: WallSnapshot) => void) {
      let socket: WebSocket | null = null
      let retry: number | undefined
      let stopped = false

      const open = () => {
        if (stopped) return
        const ws = new WebSocket(socketUrl(wallId))
        socket = ws

        ws.onmessage = (event) => {
          try {
            onState(JSON.parse(event.data as string) as WallSnapshot)
          } catch {
            /* A frame we don't understand. Ignoring it is safe: the focus
               refetch in the store reconciles anything we drop here. */
          }
        }

        // The phone's wifi hiccups, or it gets restarted. Keep trying quietly
        // rather than leaving the wall silently stale until someone reloads.
        ws.onclose = () => {
          if (!stopped) retry = window.setTimeout(open, RECONNECT_MS)
        }
        ws.onerror = () => ws.close()
      }

      open()

      return () => {
        stopped = true
        window.clearTimeout(retry)
        socket?.close()
        socket = null
      }
    },
  }
}
