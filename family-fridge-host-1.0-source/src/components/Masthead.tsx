/*
 * Spec §5 and §7: the wall opens with a sentence, not a label. Never
 * "Today's tasks"; always "Here's what's happening at home today."
 */

import { useFridge, openTasksToday } from '../lib/store'
import { Avatar } from './Avatar'

function greeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function longDate(d: Date): string {
  return d
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
}

export function Masthead() {
  const { state, dispatch } = useFridge()
  const now = new Date()
  const me = state.people.find((p) => p.id === state.currentPerson)
  const open = openTasksToday(state).length
  const toBuy = state.groceries.filter((g) => !g.done).length

  // The one line that has to earn the whole screen.
  const line =
    open === 0 && toBuy === 0
      ? 'Nothing needs you right now.'
      : open === 0
        ? 'Nothing left to do, just the shopping.'
        : "Here's what's happening at home today."

  return (
    <header className="zone masthead">
      <div className="masthead__top">
        <div className="masthead__id">
          {state.householdName && (
            <p className="t-small masthead__household">{state.householdName}</p>
          )}
          <p className="t-label muted">{longDate(now)}</p>
        </div>

        {me && (
          <button
            type="button"
            className="whoami"
            onClick={() => {
              // Rotate through the family: attribution, not a login (§21.3).
              const i = state.people.findIndex((p) => p.id === me.id)
              const next = state.people[(i + 1) % state.people.length]
              dispatch({ type: 'person/current', id: next.id })
            }}
            aria-label={`You are ${me.name}. Tap to switch to someone else.`}
          >
            <Avatar person={me} size="sm" />
            <span className="t-small">{me.name}</span>
          </button>
        )}
      </div>

      <h1 className="t-display masthead__greeting">
        {greeting(now)}.
        <br />
        <span className="muted">{line}</span>
      </h1>
    </header>
  )
}
