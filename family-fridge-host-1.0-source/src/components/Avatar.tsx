/*
 * Spec §13: a person is a name, an initial and a colour identity.
 * The colour lives in a ring and a dot, never a fill, so four people on the
 * wall don't turn it into a paint chart (§4 colour rule).
 */

import type { CSSProperties } from 'react'
import type { Person } from '../lib/types'

interface AvatarProps {
  person: Person
  size?: 'sm' | 'md' | 'lg'
  /** Draws the identity ring. Off for inline mentions. */
  ring?: boolean
}

export function Avatar({ person, size = 'md', ring = true }: AvatarProps) {
  return (
    <span
      className={`avatar avatar--${size}${ring ? ' avatar--ring' : ''}`}
      style={{ '--identity': `var(--${person.accent})` } as CSSProperties}
      aria-hidden="true"
    >
      {person.initials}
    </span>
  )
}

/** The small colour dot used next to a name in running text. */
export function IdentityDot({ person }: { person: Person }) {
  return (
    <span
      className="dot"
      style={{ '--identity': `var(--${person.accent})` } as CSSProperties}
      aria-hidden="true"
    />
  )
}
