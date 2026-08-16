/*
 * One input for the whole wall.
 *
 * Spec §23 lists "add task" and "add grocery" as separate screens, but this
 * product is a single canvas, so there's one way in. You type, it guesses
 * what you meant (see lib/classify.ts), and you can overrule the guess with
 * one tap. Minimal typing is the point on a fridge (§16); this is the shape
 * the voice input in §12 will slot straight into.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFridge } from '../lib/store'
import { classify } from '../lib/classify'
import { GROCERY_CATEGORIES, type AccentKey, type GroceryCategory, type ItemKind } from '../lib/types'
import { isoOffset, todayISO } from '../lib/seed'
import { randomPattern } from './MomentArt'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

const KINDS: { id: ItemKind; label: string; tone: string }[] = [
  { id: 'task', label: 'To do', tone: 'coral' },
  { id: 'grocery', label: 'To buy', tone: 'butter' },
  { id: 'note', label: 'Note', tone: 'note' },
  { id: 'moment', label: 'Moment', tone: 'sky' },
]

const DUES: { id: string; label: string; value: () => string | null }[] = [
  { id: 'today', label: 'Today', value: () => todayISO() },
  { id: 'tomorrow', label: 'Tomorrow', value: () => isoOffset(1) },
  { id: 'week', label: 'This week', value: () => isoOffset(5) },
  { id: 'someday', label: 'Someday', value: () => null },
]

const TONES: AccentKey[] = ['sky', 'green', 'butter', 'coral']

interface QuickAddProps {
  open: boolean
  onClose: () => void
}

export function QuickAdd({ open, onClose }: QuickAddProps) {
  const { state, dispatch } = useFridge()
  const [text, setText] = useState('')
  const [override, setOverride] = useState<ItemKind | null>(null)
  const [assignee, setAssignee] = useState<string | null>(null)
  const [due, setDue] = useState('today')
  const [category, setCategory] = useState<GroceryCategory | null>(null)
  const [tone, setTone] = useState<AccentKey>('sky')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Grow with the text: you have to be able to read what you typed from
  // across the kitchen, so nothing scrolls out of sight (§16).
  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const parsed = useMemo(() => classify(text), [text])
  const kind = override ?? parsed.kind

  // Fresh sheet every time it opens.
  useEffect(() => {
    if (!open) return
    setText('')
    setOverride(null)
    setAssignee(null)
    setDue('today')
    setCategory(null)
    setTone('sky')
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = parsed.title.trim()
    if (!title) return
    const by = state.currentPerson

    if (kind === 'task') {
      dispatch({
        type: 'task/add',
        title,
        assignee,
        due: DUES.find((d) => d.id === due)?.value() ?? null,
        by,
      })
    } else if (kind === 'grocery') {
      dispatch({
        type: 'grocery/add',
        name: title,
        qty: parsed.qty,
        category: category ?? parsed.category ?? 'Other',
        by,
      })
    } else if (kind === 'note') {
      dispatch({ type: 'note/add', body: text.trim(), by })
    } else {
      dispatch({ type: 'moment/add', caption: title, tone, pattern: randomPattern(), by })
    }

    onClose()
    document.getElementById(
      kind === 'task' ? 'today' : kind === 'grocery' ? 'shop' : kind === 'note' ? 'notes' : 'moment',
    )?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const me = state.people.find((p) => p.id === state.currentPerson)

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label="Add to the wall">
      <button className="sheet__scrim" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <form className="sheet" onSubmit={submit}>
        <div className="sheet__grab" aria-hidden="true" />

        <textarea
          ref={inputRef}
          className="sheet__input t-page"
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOverride(null)
            setCategory(null)
            grow(e.target)
          }}
          onKeyDown={(e) => {
            // Enter puts it on the fridge; Shift+Enter is a line break.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="What's on your mind?"
          aria-label="What do you want to put on the wall?"
        />

        <p className="sheet__hint t-small muted">
          {text.trim()
            ? parsed.confident
              ? 'Looks like a…'
              : "I'm guessing:"
            : `Adding as ${me?.name ?? 'you'}. Try “milk”, “call the plumber”, or “note: bins on Tuesday”.`}
        </p>

        <div className="chips">
          {KINDS.map((k) => (
            <button
              type="button"
              key={k.id}
              className={`chip chip--${k.tone}${kind === k.id ? ' is-on' : ''}`}
              onClick={() => setOverride(k.id)}
              aria-pressed={kind === k.id}
            >
              {k.label}
            </button>
          ))}
        </div>

        {kind === 'task' && (
          <div className="sheet__extra settle-in">
            <p className="t-label muted">Who</p>
            <div className="chips">
              {state.people.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`chip chip--person${assignee === p.id ? ' is-on' : ''}`}
                  onClick={() => setAssignee(assignee === p.id ? null : p.id)}
                  aria-pressed={assignee === p.id}
                >
                  <Avatar person={p} size="sm" ring={false} />
                  {p.name}
                </button>
              ))}
            </div>

            <p className="t-label muted">When</p>
            <div className="chips">
              {DUES.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  className={`chip${due === d.id ? ' is-on' : ''}`}
                  onClick={() => setDue(d.id)}
                  aria-pressed={due === d.id}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind === 'grocery' && (
          <div className="sheet__extra settle-in">
            <p className="t-label muted">Aisle</p>
            <div className="chips">
              {GROCERY_CATEGORIES.map((c) => {
                const on = (category ?? parsed.category ?? 'Other') === c
                return (
                  <button
                    type="button"
                    key={c}
                    className={`chip${on ? ' is-on' : ''}`}
                    onClick={() => setCategory(c)}
                    aria-pressed={on}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {kind === 'moment' && (
          <div className="sheet__extra settle-in">
            <p className="t-label muted">Colour</p>
            <div className="chips">
              {TONES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`swatch${tone === t ? ' is-on' : ''}`}
                  style={{ background: `var(--${t})` }}
                  onClick={() => setTone(t)}
                  aria-label={`Use the ${t} tone`}
                  aria-pressed={tone === t}
                />
              ))}
            </div>
            <p className="t-small muted">
              Placeholder artwork for now, real photographs come later.
            </p>
          </div>
        )}

        <div className="sheet__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--go" disabled={!parsed.title.trim()}>
            Put it on the fridge
            <Icon name="arrow" size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
