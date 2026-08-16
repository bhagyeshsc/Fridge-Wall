/*
 * The shared contract between the wall and whatever is hosting it.
 *
 * Two implementations live in ./backends: Supabase (the hosted deployment)
 * and local (an Android phone on the home wifi serving the same three
 * operations over plain HTTP and a websocket). The store talks only to this
 * interface, so a third host later is a new file rather than a rewrite.
 *
 * `rev` is a revision counter owned by the server. Supabase has no such
 * thing and always reports 0, which makes its saves unconditional and keeps
 * the hosted behaviour exactly as it was. A local host increments it on
 * every accepted write, which is what lets it reject a stale one.
 */

import type { FridgeState } from './types'

export interface WallSnapshot {
  state: FridgeState
  rev: number
}

export type SaveResult =
  /** Accepted. `rev` is the new server revision to send with the next save. */
  | { ok: true; rev: number }
  /** Rejected: someone else wrote first. Carries what the server has now. */
  | { ok: false; conflict: WallSnapshot }

export interface Backend {
  /**
   * Null means the wall genuinely does not exist yet, which is a brand-new
   * invite link and the thing that triggers onboarding. A transport failure
   * throws instead, so the store can tell "new household" apart from "the
   * wifi dropped" and keep the local cache in the second case.
   */
  fetch(wallId: string): Promise<WallSnapshot | null>

  save(wallId: string, state: FridgeState, rev: number): Promise<SaveResult>

  /** Returns its own teardown. */
  subscribe(wallId: string, onState: (snapshot: WallSnapshot) => void): () => void
}
