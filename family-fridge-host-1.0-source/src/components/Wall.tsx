/*
 * The one canvas.
 *
 * Every part of the product is a zone on this single surface. No routing, no
 * screens, no per-person view. Everyone standing at the fridge sees exactly
 * this, and anyone can change any of it in place.
 *
 * `lens` is the only piece of view state: tapping a family member lifts their
 * things and quiets everything else. It's temporary and never navigates.
 */

import { useState } from 'react'
import { Masthead } from './Masthead'
import { TodayZone } from './TodayZone'
import { GroceryZone } from './GroceryZone'
import { NoticeZone } from './NoticeZone'
import { MomentZone } from './MomentZone'
import { FamilyZone } from './FamilyZone'
import { ZoneRail } from './ZoneRail'
import { QuickAdd } from './QuickAdd'
import { useFridge } from '../lib/store'
import { syncEnabled } from '../lib/backends'

export function Wall() {
  const { state, dispatch } = useFridge()
  const [lens, setLens] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const lensPerson = state.people.find((p) => p.id === lens) ?? null

  return (
    <>
      <main className="wall" data-lens={lens ?? undefined}>
        <Masthead />
        <TodayZone lens={lens} />
        <GroceryZone lens={lens} />
        <NoticeZone lens={lens} />
        <MomentZone />
        <FamilyZone lens={lens} onLens={setLens} />

        <footer className="zone colophon">
          <hr className="rule" />
          <p className="t-small muted">
            The family fridge. Everything here is shared, no private lists.
          </p>
          <button
            type="button"
            className="t-small colophon__reset"
            onClick={() => {
              const prompt = syncEnabled
                ? 'Wipe this wall and set it up again from scratch?'
                : 'Wipe the wall and start from the sample family again?'
              if (confirm(prompt)) {
                dispatch({ type: 'wall/reset' })
                setLens(null)
              }
            }}
          >
            Reset the wall
          </button>
        </footer>
      </main>

      {lensPerson && (
        <button type="button" className="lens-bar" onClick={() => setLens(null)}>
          {lensPerson.name}&rsquo;s things · show everyone
        </button>
      )}

      <ZoneRail onAdd={() => setAdding(true)} />
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
