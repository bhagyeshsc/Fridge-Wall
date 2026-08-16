/*
 * Spec §14: a family magazine, not Google Photos. One large image at a time,
 * a caption, a date, and almost no controls. Swipe for the rest.
 */

import { useEffect, useRef, useState } from 'react'
import { useFridge } from '../lib/store'
import { MomentArt } from './MomentArt'
import { Icon } from './Icon'

function displayDate(iso: string): { label: string; stamp: string } {
  const d = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((today.getTime() - d.getTime()) / 864e5)

  const stamp = d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()

  if (days === 0) return { label: `Today, ${d.getFullYear()}`, stamp }
  if (days === 1) return { label: `Yesterday, ${d.getFullYear()}`, stamp }
  if (days < 7) return { label: `${days} days ago`, stamp }
  return {
    label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    stamp,
  }
}

export function MomentZone() {
  const { state, dispatch } = useFridge()
  const trackRef = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)

  // Which slide is centred. Drives the caption underneath.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const i = Math.round(track.scrollLeft / track.clientWidth)
      setIndex(Math.max(0, Math.min(i, state.moments.length - 1)))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [state.moments.length])

  if (state.moments.length === 0) {
    return (
      <section className="zone moment" id="moment" aria-labelledby="moment-h">
        <h2 className="t-label moment__head" id="moment-h">
          <span className="tick tick--memory" />
          Today&rsquo;s moment
        </h2>
        <p className="empty t-body muted">No moments yet. Add the first one.</p>
      </section>
    )
  }

  const current = state.moments[Math.min(index, state.moments.length - 1)]
  const { label, stamp } = displayDate(current.date)

  return (
    <section className="zone moment" id="moment" aria-labelledby="moment-h">
      <div className="moment__head">
        <h2 className="t-label" id="moment-h">
          <span className="tick tick--memory" />
          Today&rsquo;s moment
        </h2>
        {state.moments.length > 1 && (
          <p className="t-small muted">
            {index + 1} / {state.moments.length}
          </p>
        )}
      </div>

      <ul className="moment__track" ref={trackRef}>
        {state.moments.map((m) => (
          <li className="moment__slide" key={m.id}>
            <MomentArt tone={m.tone} pattern={m.pattern} />
          </li>
        ))}
      </ul>

      {/* Keyed so the caption crossfades as you swipe (§15). */}
      <figcaption className="moment__caption" key={current.id}>
        <p className="t-label muted">{label}</p>
        <p className="t-page moment__quote">&ldquo;{current.caption}&rdquo;</p>
        <div className="moment__foot">
          <p className="t-label">{stamp}</p>
          <button
            type="button"
            className="moment__remove"
            onClick={() => {
              dispatch({ type: 'moment/remove', id: current.id })
              setIndex(0)
              trackRef.current?.scrollTo({ left: 0 })
            }}
            aria-label="Remove this moment"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </figcaption>
    </section>
  )
}
