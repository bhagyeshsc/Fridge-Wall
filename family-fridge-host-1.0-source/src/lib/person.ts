/*
 * Shared between onboarding and the in-place family editor: how a name
 * becomes initials, and which accent a newly added person gets by default.
 */

import type { AccentKey } from './types'

export const ACCENT_CYCLE: AccentKey[] = ['sky', 'coral', 'butter', 'green']

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function nextAccent(existingCount: number): AccentKey {
  return ACCENT_CYCLE[existingCount % ACCENT_CYCLE.length]
}
