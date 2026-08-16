/*
 * The one control the whole product depends on. Spec §11: tap check →
 * subtle confirmation → the thing settles out of the active list.
 *
 * A thin ring that fills with the classifying colour and draws its tick.
 * ~200ms, ease-out, no bounce (§15).
 */

import { Icon } from './Icon'

interface CheckProps {
  checked: boolean
  onChange: () => void
  /** Which accent to fill with: tasks are coral, groceries butter (§4). */
  tone: 'coral' | 'butter'
  label: string
}

export function Check({ checked, onChange, tone, label }: CheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`check check--${tone}${checked ? ' is-checked' : ''}`}
      onClick={onChange}
    >
      <span className="check__box">
        <Icon name="check" size={16} className="check__tick" />
        <span className="check__ripple" aria-hidden="true" />
      </span>
    </button>
  )
}
