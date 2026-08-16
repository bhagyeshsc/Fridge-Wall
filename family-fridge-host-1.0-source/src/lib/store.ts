/*
 * All wall state lives here.
 *
 * Persistence sits behind `storage`, a three-method adapter, kept as a
 * same-device cache so the wall still opens instantly (and works offline)
 * before or without the host round-trip. Cross-device sync sits on top of
 * it: fetch on mount, debounce-save on change, hydrate on an incoming push.
 *
 * Which host that is lives behind the Backend interface in ./backend, so
 * this file no longer knows whether it is talking to Supabase or to a phone
 * on the shelf. The one difference it does care about is the revision: a
 * host that tracks one can refuse a stale write, and the conflict branch in
 * `pushState` below is what handles being refused.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
} from 'react'
import type {
  AccentKey,
  FridgeState,
  GroceryCategory,
  Moment,
  Person,
  Task,
} from './types'
import { emptyState, seedState, todayISO } from './seed'
import { initialsOf } from './person'
import type { WallSnapshot } from './backend'
import { backend, syncEnabled } from './backends'
import { mergeStates } from './merge'
import { resolveWallId } from './wallId'

const KEY = 'family-fridge:v1'
const SAVE_DEBOUNCE_MS = 400

export const storage = {
  load(): FridgeState | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as FridgeState
      // Shallow sanity check: a half-written or stale shape falls back to seed.
      if (!parsed.people || !Array.isArray(parsed.tasks)) return null
      return parsed
    } catch {
      return null
    }
  },
  save(state: FridgeState) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* Private mode or a full quota. The wall still works for this session. */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nothing to do */
    }
  },
}

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

export type Action =
  | { type: 'task/add'; title: string; assignee: string | null; due: string | null; note?: string; by: string }
  | { type: 'task/toggle'; id: string }
  | { type: 'task/assign'; id: string; assignee: string | null }
  | { type: 'task/remove'; id: string }
  | { type: 'grocery/add'; name: string; qty?: string; category: GroceryCategory; by: string }
  | { type: 'grocery/toggle'; id: string }
  | { type: 'grocery/remove'; id: string }
  | { type: 'grocery/clearChecked' }
  | { type: 'note/add'; body: string; by: string }
  | { type: 'note/remove'; id: string }
  | { type: 'moment/add'; caption: string; tone: Moment['tone']; pattern: number; by: string }
  | { type: 'moment/remove'; id: string }
  | { type: 'person/current'; id: string }
  | { type: 'wall/reset' }
  | { type: 'wall/hydrate'; state: FridgeState }
  | { type: 'wall/onboard'; householdName: string; people: Person[]; currentPerson: string }
  | { type: 'person/add'; name: string; accent: AccentKey; role?: string; phone?: string }
  | {
      type: 'person/update'
      id: string
      name: string
      accent: AccentKey
      role?: string
      phone?: string
    }
  | { type: 'person/remove'; id: string }

export function reducer(state: FridgeState, action: Action): FridgeState {
  switch (action.type) {
    case 'task/add': {
      const task: Task = {
        id: uid('t'),
        title: action.title,
        assignee: action.assignee,
        due: action.due,
        done: false,
        note: action.note,
        addedBy: action.by,
        createdAt: Date.now(),
      }
      return { ...state, tasks: [task, ...state.tasks] }
    }

    case 'task/toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      }

    case 'task/assign':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, assignee: action.assignee } : t,
        ),
      }

    case 'task/remove':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }

    case 'grocery/add': {
      // Adding something already on the list bumps it back to unchecked
      // rather than making a duplicate: two people, one list (§20).
      const existing = state.groceries.find(
        (g) => g.name.toLowerCase() === action.name.toLowerCase(),
      )
      if (existing) {
        return {
          ...state,
          groceries: state.groceries.map((g) =>
            g.id === existing.id
              ? { ...g, done: false, qty: action.qty ?? g.qty }
              : g,
          ),
        }
      }
      return {
        ...state,
        groceries: [
          {
            id: uid('g'),
            name: action.name,
            qty: action.qty,
            category: action.category,
            done: false,
            addedBy: action.by,
            createdAt: Date.now(),
          },
          ...state.groceries,
        ],
      }
    }

    case 'grocery/toggle':
      return {
        ...state,
        groceries: state.groceries.map((g) =>
          g.id === action.id ? { ...g, done: !g.done } : g,
        ),
      }

    case 'grocery/remove':
      return {
        ...state,
        groceries: state.groceries.filter((g) => g.id !== action.id),
      }

    case 'grocery/clearChecked':
      return { ...state, groceries: state.groceries.filter((g) => !g.done) }

    case 'note/add':
      return {
        ...state,
        notes: [
          { id: uid('n'), body: action.body, addedBy: action.by, createdAt: Date.now() },
          ...state.notes,
        ],
      }

    case 'note/remove':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }

    case 'moment/add':
      return {
        ...state,
        moments: [
          {
            id: uid('m'),
            caption: action.caption,
            date: todayISO(),
            tone: action.tone,
            pattern: action.pattern,
            addedBy: action.by,
          },
          ...state.moments,
        ],
      }

    case 'moment/remove':
      return { ...state, moments: state.moments.filter((m) => m.id !== action.id) }

    case 'person/current':
      return { ...state, currentPerson: action.id }

    case 'wall/reset':
      storage.clear()
      // A synced household resets to blank (back through onboarding), not
      // to someone else's demo family.
      return syncEnabled ? emptyState() : seedState()

    // A full replace from the host: the initial fetch on mount, a push from
    // another device, or the result of a merge after a refused save.
    case 'wall/hydrate':
      return action.state

    // The one-time setup step for a brand-new household: sets who's in it
    // and what to call it. Tasks/groceries/notes/moments are already empty
    // at this point (that's what triggered onboarding in the first place).
    case 'wall/onboard':
      return {
        ...state,
        householdName: action.householdName,
        people: action.people,
        currentPerson: action.currentPerson,
      }

    case 'person/add': {
      const person: Person = {
        id: uid('p'),
        name: action.name,
        initials: initialsOf(action.name),
        accent: action.accent,
        role: action.role,
        phone: action.phone,
      }
      return { ...state, people: [...state.people, person] }
    }

    case 'person/update':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id
            ? {
                ...p,
                name: action.name,
                initials: initialsOf(action.name),
                accent: action.accent,
                role: action.role,
                phone: action.phone,
              }
            : p,
        ),
      }

    case 'person/remove': {
      const people = state.people.filter((p) => p.id !== action.id)
      return {
        ...state,
        people,
        // Whoever's left becomes "you" if the removed person was the one
        // standing at the fridge. Tasks stay, just unassigned, not deleted.
        currentPerson: state.currentPerson === action.id ? (people[0]?.id ?? '') : state.currentPerson,
        tasks: state.tasks.map((t) => (t.assignee === action.id ? { ...t, assignee: null } : t)),
      }
    }

    default:
      return state
  }
}

export function initState(): FridgeState {
  // A synced household starts blank so a brand-new invite link triggers
  // onboarding instead of showing someone else's sample family. Local-only
  // mode (no host configured) keeps the instant sample-data experience.
  if (syncEnabled) return storage.load() ?? emptyState()
  return storage.load() ?? seedState()
}

interface FridgeContextValue {
  state: FridgeState
  dispatch: Dispatch<Action>
  /** True only while a brand-new device is waiting on the initial Supabase
   * fetch, with no local cache to show meanwhile. Avoids flashing
   * onboarding at someone who's actually joining an existing household. */
  loading: boolean
}

export const FridgeContext = createContext<FridgeContextValue | null>(null)

export function useFridgeStore() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  // Set right before a hydrate dispatch, cleared by the save effect below.
  // Stops a remote update from being saved and broadcast right back out,
  // which would otherwise loop forever between devices.
  const suppressNextSync = useRef(false)

  const wallId = useMemo(() => (syncEnabled ? resolveWallId() : null), [])

  // The revision the host last confirmed. Sent with every save, which is how
  // a device that has been asleep gets told its wall is stale instead of
  // quietly writing it over everyone else's newer one.
  const revRef = useRef(0)

  // True from the moment an edit is made until the host confirms it. While
  // it's set, an incoming push gets merged rather than applied flat, so
  // somebody else's change can't wipe what you're in the middle of typing.
  const pendingEdit = useRef(false)

  // Read inside callbacks that must not re-run on every keystroke.
  const stateRef = useRef(state)
  stateRef.current = state

  // Only a brand-new device with nothing cached locally needs to wait:
  // everyone else renders immediately from cache while the fetch reconciles
  // quietly in the background.
  const [loading, setLoading] = useState(() => syncEnabled && storage.load() === null)

  // Always keep the same-device cache warm, sync or not.
  useEffect(() => {
    storage.save(state)
  }, [state])

  // Initial fetch + the live subscription. Runs once per wall id.
  useEffect(() => {
    // Captured once per effect run so nested closures keep the null check
    // TypeScript can't otherwise carry across an imported binding.
    const host = backend
    if (!host || !wallId) return
    let cancelled = false

    const applySnapshot = (snapshot: WallSnapshot) => {
      if (cancelled) return
      revRef.current = snapshot.rev

      // Holding an unsaved edit means this push and our local wall are both
      // partly right, so fold them together and let the save effect send the
      // result on. With nothing pending, the host's copy simply wins.
      const holding = pendingEdit.current
      const next = holding ? mergeStates(stateRef.current, snapshot.state) : snapshot.state

      suppressNextSync.current = !holding
      dispatch({ type: 'wall/hydrate', state: next })
    }

    host
      .fetch(wallId)
      .then((snapshot) => {
        if (cancelled) return
        setLoading(false)
        // Null is a genuinely brand-new wall id. Stays at emptyState(),
        // which is exactly what triggers onboarding.
        if (snapshot) applySnapshot(snapshot)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoading(false)
        // eslint-disable-next-line no-console
        console.warn('[family-fridge] could not fetch the wall, staying local-only:', err)
      })

    const unsubscribe = host.subscribe(wallId, applySnapshot)

    // A dropped websocket (phone locked, wifi hiccup) resolves itself on
    // reconnect via a plain refetch rather than anything fancier.
    const onFocus = () => {
      host
        .fetch(wallId)
        .then((snapshot) => {
          if (snapshot) applySnapshot(snapshot)
        })
        .catch(() => {
          /* Still unreachable. The cache carries the wall until it isn't. */
        })
    }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      unsubscribe()
    }
  }, [wallId])

  // One save attempt, plus what to do when the host says someone wrote
  // first. The explicit type annotation is what lets it call itself for the
  // retry without TypeScript giving up on inferring its own signature.
  const pushState: (next: FridgeState, retrying?: boolean) => Promise<void> = useCallback(
    async (next, retrying = false) => {
      const host = backend
      if (!host || !wallId) return

      try {
        const result = await host.save(wallId, next, revRef.current)
        if (result.ok) {
          revRef.current = result.rev
          pendingEdit.current = false
          return
        }

        // Refused. Fold their wall into ours (see merge.ts for why it's a
        // union rather than a surrender) and put the result on screen.
        revRef.current = result.conflict.rev
        const merged = mergeStates(next, result.conflict.state)
        suppressNextSync.current = true
        dispatch({ type: 'wall/hydrate', state: merged })

        // Then try once to land it. A second refusal means writes are
        // arriving faster than a round trip, so stop rather than spin: the
        // merged wall is already correct locally and the next edit resaves.
        if (!retrying) await pushState(merged, true)
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.warn('[family-fridge] could not save to the shared wall:', err)
      }
    },
    [wallId],
  )

  // Push local changes out, debounced, and skipped entirely for a change
  // that just came from a hydrate.
  useEffect(() => {
    if (!backend || !wallId) return

    if (suppressNextSync.current) {
      suppressNextSync.current = false
      return
    }

    pendingEdit.current = true
    const timer = window.setTimeout(() => {
      void pushState(state)
    }, SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [state, wallId, pushState])

  return useMemo(() => ({ state, dispatch, loading }), [state, loading])
}

export function useFridge(): FridgeContextValue {
  const ctx = useContext(FridgeContext)
  if (!ctx) throw new Error('useFridge must be used inside <FridgeContext.Provider>')
  return ctx
}

/* ---------- Derived reads ------------------------------------ */

export function usePerson(id: string | null) {
  const { state } = useFridge()
  return id ? (state.people.find((p) => p.id === id) ?? null) : null
}

/** Today's open tasks: what the wall actually asks you about (§7). */
export function openTasksToday(state: FridgeState): Task[] {
  const today = todayISO()
  return state.tasks.filter((t) => !t.done && t.due === today)
}

export function laterTasks(state: FridgeState): Task[] {
  const today = todayISO()
  return state.tasks.filter((t) => !t.done && (t.due === null || t.due > today))
}

export function overdueTasks(state: FridgeState): Task[] {
  const today = todayISO()
  return state.tasks.filter((t) => !t.done && t.due !== null && t.due < today)
}
