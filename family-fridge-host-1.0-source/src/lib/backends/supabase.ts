/*
 * The hosted host.
 *
 * Behaviour here is deliberately unchanged from before the Backend interface
 * existed: two RPCs and a broadcast channel for fanout, no revision check,
 * last write wins. Supabase has no revision of its own, so this reports 0
 * everywhere, which makes every save unconditional and keeps the deployed
 * wall working exactly as it did.
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { Backend, SaveResult, WallSnapshot } from '../backend'
import type { FridgeState } from '../types'

export function createSupabaseBackend(): Backend | null {
  const client = supabase
  if (!client) return null

  // Held across calls because saving has to push the fanout itself. A local
  // host does that server-side, which is the part this one cannot.
  let channel: RealtimeChannel | null = null

  return {
    async fetch(wallId: string): Promise<WallSnapshot | null> {
      const { data, error } = await client.rpc('get_wall', { wall_id: wallId })
      if (error) throw new Error(error.message)
      // No row is a genuinely new wall id, not a failure.
      return data ? { state: data as FridgeState, rev: 0 } : null
    },

    async save(wallId: string, state: FridgeState): Promise<SaveResult> {
      const { error } = await client.rpc('save_wall', { wall_id: wallId, new_state: state })
      if (error) throw new Error(error.message)
      channel?.send({ type: 'broadcast', event: 'state', payload: { state } })
      return { ok: true, rev: 0 }
    },

    subscribe(wallId: string, onState: (snapshot: WallSnapshot) => void) {
      const ch = client
        .channel(`wall:${wallId}`)
        .on('broadcast', { event: 'state' }, ({ payload }) => {
          onState({ state: payload.state as FridgeState, rev: 0 })
        })
        .subscribe()
      channel = ch

      return () => {
        client.removeChannel(ch)
        channel = null
      }
    },
  }
}
