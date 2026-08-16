/*
 * Spec §9 asks for persistent, quiet, easy-to-hit navigation with a pill
 * active state, but this product is one canvas, so the rail *scrolls* to a
 * zone instead of routing to a screen. Nobody ever leaves the wall.
 *
 * Icon-only at rest; the zone you're looking at expands to show its name.
 */

import { useEffect, useState } from 'react'
import { Icon, type IconName } from './Icon'

export interface ZoneDef {
  id: string
  label: string
  icon: IconName
}

export const ZONES: ZoneDef[] = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'shop', label: 'Shop', icon: 'basket' },
  { id: 'notes', label: 'Notes', icon: 'pin' },
  { id: 'moment', label: 'Moment', icon: 'frame' },
  { id: 'family', label: 'Family', icon: 'people' },
]

interface ZoneRailProps {
  onAdd: () => void
}

export function ZoneRail({ onAdd }: ZoneRailProps) {
  const [active, setActive] = useState('today')

  // Whichever zone owns the middle of the viewport is the one you're reading.
  useEffect(() => {
    const els = ZONES.map((z) => document.getElementById(z.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="rail" aria-label="Jump to a part of the wall">
      <ul className="rail__list">
        {ZONES.map((z) => {
          const isActive = active === z.id
          return (
            <li key={z.id}>
              <button
                type="button"
                className={`rail__chip${isActive ? ' is-active' : ''}`}
                onClick={() => go(z.id)}
                aria-current={isActive ? 'true' : undefined}
                /* The label is visually collapsed until active, so name the
                   button explicitly rather than relying on it. */
                aria-label={z.label}
              >
                <Icon name={z.icon} size={20} />
                <span className="rail__label t-small">{z.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="rail__add" onClick={onAdd} aria-label="Add something to the wall">
        <Icon name="plus" size={22} />
      </button>
    </nav>
  )
}
