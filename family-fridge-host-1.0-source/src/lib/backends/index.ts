/*
 * Which host this build talks to.
 *
 * Chosen at build time rather than probed at runtime, because the Android
 * APK ships its own bundle and the hosted deployment ships another. One
 * flag, no detection, nothing to get wrong at 7am when the wall won't load.
 *
 * Null means neither host is configured, which is the local-only mode the
 * wall has always supported: localStorage alone, sample family seeded.
 */

import type { Backend } from '../backend'
import { createSupabaseBackend } from './supabase'
import { createLocalBackend } from './local'

export const backend: Backend | null =
  import.meta.env.VITE_BACKEND === 'local' ? createLocalBackend() : createSupabaseBackend()

/** Replaces the old `supabaseConfigured` check everywhere it gated sync. */
export const syncEnabled = backend !== null
