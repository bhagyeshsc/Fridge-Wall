/*
 * Both env vars are meant to be public. The anon key alone grants nothing.
 * Direct table access is closed (see the SQL in the project README); the
 * only door in is the two RPC functions, each scoped to one wall id.
 */

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

// Silent when a local host is doing the syncing, because there the absence
// of Supabase config is the intended arrangement rather than a shortfall.
if (!supabaseConfigured && import.meta.env.VITE_BACKEND !== 'local') {
  // Not an error: the wall still works locally on localStorage alone.
  // eslint-disable-next-line no-console
  console.warn(
    '[family-fridge] No Supabase config found, running local-only. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sync across devices.',
  )
}

export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null
