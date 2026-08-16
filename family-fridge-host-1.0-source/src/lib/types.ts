/* The shape of a household. Spec §11 tasks, §12 groceries, §13 family, §14 memories. */

export type AccentKey = 'coral' | 'butter' | 'sky' | 'green'

/** Spec §13: the family is the primary entity. */
export interface Person {
  id: string
  name: string
  initials: string
  /** Their colour identity on the wall. */
  accent: AccentKey
  role?: string
  phone?: string
}

/** Spec §11: title, assignee, due, completion, optional note. */
export interface Task {
  id: string
  title: string
  assignee: string | null
  /** ISO yyyy-mm-dd, or null for "sometime". */
  due: string | null
  done: boolean
  note?: string
  addedBy: string | null
  createdAt: number
}

export const GROCERY_CATEGORIES = [
  'Dairy',
  'Fruit & Veg',
  'Pantry',
  'Household',
  'Other',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

/** Spec §12: name, quantity, category, check state, optional assignment. */
export interface GroceryItem {
  id: string
  name: string
  qty?: string
  category: GroceryCategory
  done: boolean
  addedBy: string | null
  createdAt: number
}

/** The actual magnet-and-paper note. Spec §18 "important family information". */
export interface Note {
  id: string
  body: string
  addedBy: string | null
  createdAt: number
}

/** Spec §14: editorial, not a photo manager. Placeholder art until real photos. */
export interface Moment {
  id: string
  caption: string
  /** ISO yyyy-mm-dd */
  date: string
  tone: AccentKey
  /** Which abstract composition to draw, 0-indexed. */
  pattern: number
  addedBy: string | null
}

export interface FridgeState {
  /** Set once, in onboarding. Empty until then, which is the onboarding trigger. */
  householdName: string
  people: Person[]
  tasks: Task[]
  groceries: GroceryItem[]
  notes: Note[]
  moments: Moment[]
  /**
   * Who is standing at the fridge right now. Attribution only: there is no
   * login and no private view. Everyone sees the identical wall (§21.3).
   */
  currentPerson: string
}

export type ItemKind = 'task' | 'grocery' | 'note' | 'moment'
