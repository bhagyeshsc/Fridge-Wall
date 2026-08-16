/*
 * Spec §12: optimised for speed. Categories, quantity, check off, and a
 * shopping-trip state: checked items stay put and struck through while you're
 * walking the aisles, then get cleared in one go. Tasks vanish; groceries
 * don't, because you need to see what you already picked up.
 *
 * Thin-bordered rectangular module, deliberately set against the rounded
 * cards above and below it (§6).
 */

import { useState } from 'react'
import { useFridge } from '../lib/store'
import { GROCERY_CATEGORIES, type GroceryCategory } from '../lib/types'
import { classify } from '../lib/classify'
import { Check } from './Check'
import { Icon } from './Icon'
import { IdentityDot } from './Avatar'

interface GroceryZoneProps {
  lens: string | null
}

export function GroceryZone({ lens }: GroceryZoneProps) {
  const { state, dispatch } = useFridge()
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)

  const open = state.groceries.filter((g) => !g.done)
  const picked = state.groceries.filter((g) => g.done)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const parsed = classify(text)
    dispatch({
      type: 'grocery/add',
      name: parsed.title,
      qty: parsed.qty,
      // Anything typed into this box is a grocery, whatever the classifier
      // thought. The person aimed at the shopping list.
      category: (parsed.category ?? 'Other') as GroceryCategory,
      by: state.currentPerson,
    })
    setDraft('')
  }

  const byCategory = GROCERY_CATEGORIES.map((c) => ({
    category: c,
    items: state.groceries.filter((g) => g.category === c),
  })).filter((g) => g.items.length > 0)

  return (
    <section className="zone shop" id="shop" aria-labelledby="shop-h">
      <div className="shop__head">
        <h2 className="t-label" id="shop-h">
          <span className="tick tick--grocery" />
          Groceries
        </h2>
        <p className="t-small muted">
          {open.length} to buy
          {picked.length > 0 && ` · ${picked.length} in the basket`}
        </p>
      </div>

      <div className="shop__module">
        {byCategory.length === 0 && (
          <p className="empty t-body muted">The list is empty. Nice.</p>
        )}

        {byCategory.map(({ category, items }) => (
          <div className="shop__cat" key={category}>
            <p className="t-small shop__cat-label">{category}</p>
            <ul>
              {items.map((item) => {
                const who = state.people.find((p) => p.id === item.addedBy) ?? null
                const dimmed = lens !== null && item.addedBy !== lens
                return (
                  <li
                    key={item.id}
                    className={`grocery${item.done ? ' is-done' : ''}${dimmed ? ' is-dimmed' : ''}`}
                  >
                    <Check
                      checked={item.done}
                      onChange={() => dispatch({ type: 'grocery/toggle', id: item.id })}
                      tone="butter"
                      label={`${item.done ? 'Put back' : 'Picked up'} ${item.name}`}
                    />
                    <span className="grocery__name t-body">{item.name}</span>
                    {item.qty && <span className="grocery__qty t-small muted">{item.qty}</span>}
                    {who && <IdentityDot person={who} />}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {adding ? (
          <form className="shop__add settle-in" onSubmit={submit}>
            <Icon name="plus" size={20} />
            <input
              className="shop__input t-body"
              value={draft}
              autoFocus
              placeholder="Milk, 2 kg atta, bananas…"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (!draft.trim()) setAdding(false)
              }}
              aria-label="Add a grocery item"
            />
          </form>
        ) : (
          <button type="button" className="shop__add-btn" onClick={() => setAdding(true)}>
            <Icon name="plus" size={20} />
            <span className="t-body">Add to the list</span>
          </button>
        )}
      </div>

      {picked.length > 0 && (
        <button
          type="button"
          className="shop__clear t-small"
          onClick={() => dispatch({ type: 'grocery/clearChecked' })}
        >
          Clear {picked.length} picked up
        </button>
      )}
    </section>
  )
}
