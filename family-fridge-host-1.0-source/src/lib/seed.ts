/*
 * What's already on the fridge when you walk up to it for the first time.
 * Content follows the spec's own examples (§7, §11, §12, §13, §14) so the
 * prototype reads like the thing that was described.
 *
 * Names are seed data. Edit them here, or from the wall itself.
 */

import type { FridgeState, Moment, Person } from './types'

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Days from today, negative for the past. */
export function isoOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISO(d)
}

/*
 * An entirely fictional household. Phone numbers are from the range Ofcom
 * reserves for drama and fiction (+44 7700 900000 to 900999), so none of
 * them can ever ring a real person.
 */
export const PEOPLE: Person[] = [
  { id: 'p1', name: 'James Bond', initials: 'JB', accent: 'sky', role: 'Dad', phone: '+44 7700 900007' },
  { id: 'p2', name: 'Eve Moneypenny', initials: 'EM', accent: 'coral', role: 'Mum', phone: '+44 7700 900021' },
  { id: 'p3', name: 'Q', initials: 'Q', accent: 'butter', role: 'Son' },
  { id: 'p4', name: 'M', initials: 'M', accent: 'green', role: 'Grandma', phone: '+44 7700 900001' },
]

const MOMENTS: Moment[] = [
  {
    id: 'm1',
    caption: 'Q discovered the sprinkler.',
    date: todayISO(),
    tone: 'sky',
    pattern: 0,
    addedBy: 'p2',
  },
  {
    id: 'm2',
    caption: 'Park day with the little one.',
    date: isoOffset(-3),
    tone: 'green',
    pattern: 1,
    addedBy: 'p1',
  },
  {
    id: 'm3',
    caption: "M's birthday, all four of us in one frame.",
    date: isoOffset(-21),
    tone: 'butter',
    pattern: 2,
    addedBy: 'p1',
  },
]

/** A genuinely blank wall, what a brand-new invite link starts as, before onboarding. */
export function emptyState(): FridgeState {
  return {
    householdName: '',
    people: [],
    tasks: [],
    groceries: [],
    notes: [],
    moments: [],
    currentPerson: '',
  }
}

export function seedState(): FridgeState {
  const now = Date.now()

  return {
    householdName: 'The Bond Family',
    people: PEOPLE,
    currentPerson: 'p1',
    moments: MOMENTS,

    tasks: [
      {
        id: 't1',
        title: 'Call electrician',
        assignee: 'p1',
        due: todayISO(),
        done: false,
        note: 'Kitchen light keeps flickering.',
        addedBy: 'p2',
        createdAt: now - 1000 * 60 * 60 * 20,
      },
      {
        id: 't2',
        title: 'Buy groceries',
        assignee: 'p2',
        due: todayISO(),
        done: false,
        addedBy: 'p2',
        createdAt: now - 1000 * 60 * 60 * 18,
      },
      {
        id: 't3',
        title: 'Pick up Q',
        assignee: 'p1',
        due: todayISO(),
        done: false,
        note: '4:30 from school gate.',
        addedBy: 'p1',
        createdAt: now - 1000 * 60 * 60 * 6,
      },
      {
        id: 't4',
        title: "Renew M's medical insurance",
        assignee: 'p4',
        due: isoOffset(4),
        done: false,
        addedBy: 'p1',
        createdAt: now - 1000 * 60 * 60 * 48,
      },
      {
        id: 't5',
        title: 'Water the balcony plants',
        assignee: 'p3',
        due: todayISO(),
        done: true,
        addedBy: 'p4',
        createdAt: now - 1000 * 60 * 60 * 30,
      },
    ],

    groceries: [
      { id: 'g1', name: 'Milk', qty: '2 L', category: 'Dairy', done: false, addedBy: 'p2', createdAt: now - 5000 },
      { id: 'g2', name: 'Curd', category: 'Dairy', done: false, addedBy: 'p4', createdAt: now - 4900 },
      { id: 'g3', name: 'Eggs', qty: 'a dozen', category: 'Dairy', done: false, addedBy: 'p1', createdAt: now - 4800 },
      { id: 'g4', name: 'Bananas', category: 'Fruit & Veg', done: false, addedBy: 'p3', createdAt: now - 4700 },
      { id: 'g5', name: 'Apples', category: 'Fruit & Veg', done: false, addedBy: 'p2', createdAt: now - 4600 },
      { id: 'g6', name: 'Coriander', category: 'Fruit & Veg', done: true, addedBy: 'p4', createdAt: now - 4500 },
      { id: 'g7', name: 'Rice', qty: '5 kg', category: 'Pantry', done: false, addedBy: 'p4', createdAt: now - 4400 },
      { id: 'g8', name: 'Atta', qty: '10 kg', category: 'Pantry', done: false, addedBy: 'p2', createdAt: now - 4300 },
      { id: 'g9', name: 'Dish soap', category: 'Household', done: false, addedBy: 'p1', createdAt: now - 4200 },
    ],

    notes: [
      {
        id: 'n1',
        body: 'Plumber comes Saturday between 10 and 12. Someone needs to be home.',
        addedBy: 'p2',
        createdAt: now - 1000 * 60 * 60 * 26,
      },
      {
        id: 'n2',
        body: "Q's school is shut Thursday, teacher training day.",
        addedBy: 'p1',
        createdAt: now - 1000 * 60 * 60 * 50,
      },
    ],
  }
}
