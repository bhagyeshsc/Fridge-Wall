/*
 * Spec §13: coordination and family identity, not a social network.
 *
 * Because this is one canvas, tapping a person doesn't navigate anywhere.
 * It lifts everything that's theirs and quiets the rest, a lens over the
 * same wall everyone else is looking at (§21.3). Tap again to let go.
 *
 * Family membership isn't fixed at onboarding: anyone can add, edit, or
 * remove a person from here, and (when this build is wired up to Supabase)
 * reopen the invite link to bring someone new in.
 */

import { useState, type FormEvent } from 'react'
import { copyText } from '../lib/clipboard'
import { useFridge } from '../lib/store'
import type { AccentKey } from '../lib/types'
import { ACCENT_CYCLE } from '../lib/person'
import { syncEnabled } from '../lib/backends'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

interface FamilyZoneProps {
  lens: string | null
  onLens: (id: string | null) => void
}

interface PersonFormProps {
  initial: { name: string; role: string; phone: string; accent: AccentKey }
  canRemove: boolean
  onSave: (v: { name: string; role: string; phone: string; accent: AccentKey }) => void
  onRemove: () => void
  onCancel: () => void
}

function PersonForm({ initial, canRemove, onSave, onRemove, onCancel }: PersonFormProps) {
  const [name, setName] = useState(initial.name)
  const [role, setRole] = useState(initial.role)
  const [phone, setPhone] = useState(initial.phone)
  const [accent, setAccent] = useState(initial.accent)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), role: role.trim(), phone: phone.trim(), accent })
  }

  return (
    <form className="person-form settle-in" onSubmit={submit}>
      <input
        className="onboard__input onboard__input--inline t-body"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        autoFocus
      />

      <div className="person-form__row">
        <input
          className="person-form__field t-small"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role, e.g. Dad"
        />
        <input
          className="person-form__field t-small"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          inputMode="tel"
        />
      </div>

      <div className="chips person-form__accents">
        {ACCENT_CYCLE.map((a) => (
          <button
            type="button"
            key={a}
            className={`swatch${accent === a ? ' is-on' : ''}`}
            style={{ background: `var(--${a})` }}
            onClick={() => setAccent(a)}
            aria-label={`Use the ${a} colour`}
            aria-pressed={accent === a}
          />
        ))}
      </div>

      <div className="person-form__actions">
        {canRemove ? (
          <button type="button" className="btn btn--quiet person-form__remove" onClick={onRemove}>
            <Icon name="trash" size={18} />
            Remove
          </button>
        ) : (
          <span />
        )}
        <div className="person-form__save">
          <button type="button" className="btn btn--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--go" disabled={!name.trim()}>
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

export function FamilyZone({ lens, onLens }: FamilyZoneProps) {
  const { state, dispatch } = useFridge()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const addPerson = (e: FormEvent) => {
    e.preventDefault()
    const name = draftName.trim()
    if (!name) return
    dispatch({
      type: 'person/add',
      name,
      accent: ACCENT_CYCLE[state.people.length % ACCENT_CYCLE.length],
    })
    setDraftName('')
    setAdding(false)
  }

  const copyLink = async () => {
    // Falls back to execCommand where the clipboard API isn't exposed, which
    // is every http host. If even that fails, the link is still on screen.
    if (!(await copyText(window.location.href))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="zone family" id="family" aria-labelledby="family-h">
      <div className="family__head">
        <h2 className="t-label" id="family-h">
          <span className="tick tick--family" />
          Our family
        </h2>
        <div className="family__head-actions">
          {lens && (
            <button type="button" className="t-small family__clear" onClick={() => onLens(null)}>
              Show everyone
            </button>
          )}
          {syncEnabled && (
            <button
              type="button"
              className="family__invite-btn t-small"
              onClick={() => setInviteOpen((o) => !o)}
              aria-pressed={inviteOpen}
            >
              <Icon name="link" size={16} />
              Invite
            </button>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div className="invite-panel settle-in">
          <p className="t-small muted">
            Anyone with this link sees this exact wall. Send it to whoever&rsquo;s joining.
          </p>
          <p className="invite-panel__link t-small">{window.location.href}</p>
          <button type="button" className="btn btn--go invite-panel__copy" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}

      <ul className="family__list">
        {state.people.map((p) => {
          const open = state.tasks.filter((t) => !t.done && t.assignee === p.id).length
          const on = lens === p.id
          const editing = editingId === p.id

          return (
            <li
              key={p.id}
              className={`member${on ? ' is-on' : ''}${lens && !on ? ' is-dimmed' : ''}`}
            >
              <div className="member__row">
                <button
                  type="button"
                  className="member__lens"
                  onClick={() => onLens(on ? null : p.id)}
                  aria-pressed={on}
                  aria-label={`${p.name}${open ? `, ${open} open tasks` : ''}. Highlight their things on the wall.`}
                >
                  <Avatar person={p} size="lg" />
                  <span className="member__text">
                    <span className="member__name t-body">{p.name}</span>
                    <span className="member__meta t-small muted">
                      {p.role}
                      {open > 0 && ` · ${open} open`}
                    </span>
                  </span>
                </button>

                {p.phone && !editing && (
                  <a className="member__phone t-small" href={`tel:${p.phone.replace(/\s/g, '')}`}>
                    {p.phone}
                  </a>
                )}

                <button
                  type="button"
                  className="member__edit"
                  onClick={() => setEditingId(editing ? null : p.id)}
                  aria-label={`Edit ${p.name}`}
                  aria-pressed={editing}
                >
                  <Icon name="edit" size={17} />
                </button>
              </div>

              {editing && (
                <PersonForm
                  initial={{
                    name: p.name,
                    role: p.role ?? '',
                    phone: p.phone ?? '',
                    accent: p.accent,
                  }}
                  canRemove={state.people.length > 1}
                  onCancel={() => setEditingId(null)}
                  onSave={(v) => {
                    dispatch({
                      type: 'person/update',
                      id: p.id,
                      name: v.name,
                      accent: v.accent,
                      role: v.role || undefined,
                      phone: v.phone || undefined,
                    })
                    setEditingId(null)
                  }}
                  onRemove={() => {
                    dispatch({ type: 'person/remove', id: p.id })
                    setEditingId(null)
                    if (lens === p.id) onLens(null)
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>

      {adding ? (
        <form className="family__add" onSubmit={addPerson}>
          <Icon name="plus" size={20} />
          <input
            className="family__add-input t-body"
            value={draftName}
            autoFocus
            placeholder="Add someone to the family"
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              if (!draftName.trim()) setAdding(false)
            }}
          />
        </form>
      ) : (
        <button type="button" className="family__add-btn" onClick={() => setAdding(true)}>
          <Icon name="plus" size={20} />
          <span className="t-body">Add someone</span>
        </button>
      )}
    </section>
  )
}
