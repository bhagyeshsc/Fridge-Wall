/*
 * Shown once, the first time anyone opens a brand-new wall. Triggered by
 * `state.people.length === 0` (see initState() in lib/store.ts). Sets the
 * household's name and who's in it, then, if this build is wired up to
 * Supabase, surfaces the one link that IS the invite, ready to copy and
 * send to the rest of the family.
 *
 * Kept to three short steps (four with the invite) on purpose: this is the
 * one screen a non-technical family member has to get through before the
 * fridge is useful, so it stays minimal-typing throughout (§16) rather than
 * asking for roles, phone numbers, or colour choices up front. Those can
 * still be added later from the Family zone.
 */

import { useState, type CSSProperties, type FormEvent } from 'react'
import { uid, useFridge } from '../lib/store'
import type { AccentKey, Person } from '../lib/types'
import { ACCENT_CYCLE, initialsOf } from '../lib/person'
import { syncEnabled } from '../lib/backends'
import { copyText } from '../lib/clipboard'
import { Icon } from './Icon'

interface Draft {
  id: string
  name: string
  accent: AccentKey
}

type Step = 'name' | 'people' | 'who' | 'invite'

export function Onboarding() {
  const { dispatch } = useFridge()
  const [step, setStep] = useState<Step>('name')
  const [householdName, setHouseholdName] = useState('')
  const [people, setPeople] = useState<Draft[]>([])
  const [draftName, setDraftName] = useState('')
  const [meId, setMeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const showInviteStep = syncEnabled
  const totalSteps = showInviteStep ? 4 : 3
  const stepNumber = { name: 1, people: 2, who: 3, invite: 4 }[step]

  const addPerson = (e: FormEvent) => {
    e.preventDefault()
    const name = draftName.trim()
    if (!name) return
    setPeople((prev) => [
      ...prev,
      { id: uid('p'), name, accent: ACCENT_CYCLE[prev.length % ACCENT_CYCLE.length] },
    ])
    setDraftName('')
  }

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    if (meId === id) setMeId(null)
  }

  const finish = () => {
    if (!meId) return
    const finalPeople: Person[] = people.map((p) => ({
      id: p.id,
      name: p.name,
      initials: initialsOf(p.name),
      accent: p.accent,
    }))
    dispatch({
      type: 'wall/onboard',
      householdName: householdName.trim() || 'Our Fridge',
      people: finalPeople,
      currentPerson: meId,
    })
  }

  const copyLink = async () => {
    // Falls back to execCommand where the clipboard API isn't exposed, which
    // is every http host. If even that fails, the link is still on screen.
    if (!(await copyText(window.location.href))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="onboard">
      <div className="onboard__step settle-in" key={step}>
        <p className="t-label muted onboard__count">
          Step {stepNumber} of {totalSteps}
        </p>

        {step === 'name' && (
          <>
            <h1 className="t-display">What should we call your fridge?</h1>
            <p className="t-body muted onboard__hint">
              Something like a family name. Just for the two of you to recognise it, nobody
              else needs to see this.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setStep('people')
              }}
            >
              <input
                className="onboard__input t-page"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="The Bond Family"
                autoFocus
              />
              <div className="onboard__actions">
                <span />
                <button type="submit" className="btn btn--go">
                  Continue
                  <Icon name="arrow" size={20} />
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'people' && (
          <>
            <h1 className="t-page">Who&rsquo;s in the family?</h1>
            <p className="t-body muted onboard__hint">
              Add everyone who&rsquo;ll use the wall. You can add more people later.
            </p>

            {people.length > 0 && (
              <ul className="onboard__people">
                {people.map((p) => (
                  <li key={p.id} className="onboard__person">
                    <span
                      className="avatar avatar--md avatar--ring"
                      style={{ '--identity': `var(--${p.accent})` } as CSSProperties}
                    >
                      {initialsOf(p.name)}
                    </span>
                    <span className="t-body onboard__person-name">{p.name}</span>
                    <button
                      type="button"
                      className="onboard__person-remove"
                      onClick={() => removePerson(p.id)}
                      aria-label={`Remove ${p.name}`}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="onboard__add" onSubmit={addPerson}>
              <input
                className="onboard__input onboard__input--inline t-body"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Add a name"
                autoFocus={people.length === 0}
              />
              <button type="submit" className="btn btn--quiet" disabled={!draftName.trim()}>
                <Icon name="plus" size={20} />
                Add
              </button>
            </form>

            <div className="onboard__actions">
              <button type="button" className="btn btn--quiet" onClick={() => setStep('name')}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--go"
                disabled={people.length === 0}
                onClick={() => setStep('who')}
              >
                Continue
                <Icon name="arrow" size={20} />
              </button>
            </div>
          </>
        )}

        {step === 'who' && (
          <>
            <h1 className="t-page">Which one&rsquo;s you?</h1>
            <p className="t-body muted onboard__hint">
              Just so the wall knows who added what. Anyone can switch this later by tapping
              their name at the top.
            </p>

            <div className="onboard__who">
              {people.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`onboard__who-opt${meId === p.id ? ' is-on' : ''}`}
                  onClick={() => setMeId(p.id)}
                >
                  <span
                    className="avatar avatar--lg avatar--ring"
                    style={{ '--identity': `var(--${p.accent})` } as CSSProperties}
                  >
                    {initialsOf(p.name)}
                  </span>
                  <span className="t-body">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="onboard__actions">
              <button type="button" className="btn btn--quiet" onClick={() => setStep('people')}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--go"
                disabled={!meId}
                onClick={() => (showInviteStep ? setStep('invite') : finish())}
              >
                {showInviteStep ? 'Continue' : 'Put it on the fridge'}
                <Icon name="arrow" size={20} />
              </button>
            </div>
          </>
        )}

        {step === 'invite' && (
          <>
            <h1 className="t-page">Invite the rest of the family</h1>
            <p className="t-body muted onboard__hint">
              This link is the only key. Whoever opens it sees this exact wall. No account, no
              sign-in. Send it however you&rsquo;d normally message them.
            </p>

            <div className="onboard__link">
              <p className="t-small onboard__link-text">{window.location.href}</p>
              <button type="button" className="btn btn--go onboard__copy" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>

            <div className="onboard__actions">
              <button type="button" className="btn btn--quiet" onClick={() => setStep('who')}>
                Back
              </button>
              <button type="button" className="btn btn--go" onClick={finish}>
                Put it on the fridge
                <Icon name="arrow" size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
