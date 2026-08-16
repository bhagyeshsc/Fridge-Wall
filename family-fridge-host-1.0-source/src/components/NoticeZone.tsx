/*
 * The paper note under a magnet. Spec §18: "important family information".
 *
 * Deliberately the one zone with no accent colour: the palette maps colour to
 * the four content types (§4), so a note earns none. Ink on paper, a hairline
 * border, nothing else. It reads as the most literal object on the wall.
 */

import { useFridge } from '../lib/store'
import { IdentityDot } from './Avatar'
import { Icon } from './Icon'

function when(ts: number): string {
  const hours = Math.round((Date.now() - ts) / 36e5)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

interface NoticeZoneProps {
  lens: string | null
}

export function NoticeZone({ lens }: NoticeZoneProps) {
  const { state, dispatch } = useFridge()

  if (state.notes.length === 0) return null

  return (
    <section className="zone notes" id="notes" aria-labelledby="notes-h">
      <h2 className="t-label notes__head" id="notes-h">
        <span className="tick tick--note" />
        Worth knowing
      </h2>

      <ul className="notes__list">
        {state.notes.map((n) => {
          const who = state.people.find((p) => p.id === n.addedBy) ?? null
          const dimmed = lens !== null && n.addedBy !== lens
          return (
            <li key={n.id} className={`note${dimmed ? ' is-dimmed' : ''}`}>
              <p className="note__body t-section">{n.body}</p>
              <div className="note__foot">
                <span className="t-small muted">
                  {who && <IdentityDot person={who} />}
                  {who?.name} · {when(n.createdAt)}
                </span>
                <button
                  type="button"
                  className="note__remove"
                  onClick={() => dispatch({ type: 'note/remove', id: n.id })}
                  aria-label="Take this note off the fridge"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
