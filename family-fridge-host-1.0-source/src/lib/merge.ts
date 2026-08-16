/*
 * What to do when the host says someone else wrote first.
 *
 * The wall syncs as one whole-state blob, so there is no operation log to
 * replay and no true three-way merge available. What there is: five
 * collections of id-keyed items that are almost always *appended* to. Two
 * people adding a grocery item within the same 400ms debounce window is the
 * single most common way this app gets edited concurrently.
 *
 * So the merge is an additive union by id, ours winning any collision, and
 * scalars taken from ours. Both items survive, which is the outcome anyone
 * standing at a fridge would expect.
 *
 * The known cost: a delete on the other device gets resurrected if we still
 * have the item locally. That is deliberate. Losing a note somebody just
 * wrote is a worse failure than a ticked-off item reappearing once, and the
 * second one is visible and fixable while the first is silent.
 */

import type { FridgeState } from './types'

function unionById<T extends { id: string }>(ours: T[], theirs: T[]): T[] {
  const seen = new Set(ours.map((item) => item.id))
  // Ours first so a collision keeps our version, then whatever the other
  // device has that we have never seen.
  return [...ours, ...theirs.filter((item) => !seen.has(item.id))]
}

export function mergeStates(ours: FridgeState, theirs: FridgeState): FridgeState {
  return {
    // Scalars (household name, who's standing at the fridge) come from us.
    ...theirs,
    ...ours,
    people: unionById(ours.people, theirs.people),
    tasks: unionById(ours.tasks, theirs.tasks),
    groceries: unionById(ours.groceries, theirs.groceries),
    notes: unionById(ours.notes, theirs.notes),
    moments: unionById(ours.moments, theirs.moments),
  }
}
