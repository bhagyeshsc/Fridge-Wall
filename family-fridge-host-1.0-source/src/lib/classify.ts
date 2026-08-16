/*
 * Quick Add is one input for the whole wall, so we have to guess what the
 * person meant. Spec §12 wants "add milk to groceries" spoken aloud to become
 * a structured item; until there's speech, typed text goes through the same
 * idea: infer, show the guess, let it be overridden with one tap.
 */

import type { GroceryCategory, ItemKind } from './types'

/** Verbs that almost always mean "someone has to go and do a thing". */
const ACTION_VERBS = [
  'call',
  'book',
  'pay',
  'fix',
  'clean',
  'take',
  'drop',
  'pick',
  'send',
  'email',
  'order',
  'collect',
  'renew',
  'refill',
  'water',
  'wash',
  'return',
  'cancel',
  'schedule',
  'post',
  'file',
  'sort',
  'empty',
  'defrost',
  'repair',
  'replace',
  'sign',
  'submit',
  'confirm',
  'visit',
  'ring',
  'text',
  'remind',
]

const CATEGORY_LEXICON: Record<string, GroceryCategory> = {
  milk: 'Dairy',
  curd: 'Dairy',
  yoghurt: 'Dairy',
  yogurt: 'Dairy',
  paneer: 'Dairy',
  butter: 'Dairy',
  cheese: 'Dairy',
  cream: 'Dairy',
  ghee: 'Dairy',
  eggs: 'Dairy',
  egg: 'Dairy',

  bananas: 'Fruit & Veg',
  banana: 'Fruit & Veg',
  apples: 'Fruit & Veg',
  apple: 'Fruit & Veg',
  mangoes: 'Fruit & Veg',
  oranges: 'Fruit & Veg',
  grapes: 'Fruit & Veg',
  tomatoes: 'Fruit & Veg',
  onions: 'Fruit & Veg',
  potatoes: 'Fruit & Veg',
  spinach: 'Fruit & Veg',
  coriander: 'Fruit & Veg',
  carrots: 'Fruit & Veg',
  lemons: 'Fruit & Veg',
  garlic: 'Fruit & Veg',
  ginger: 'Fruit & Veg',

  rice: 'Pantry',
  atta: 'Pantry',
  flour: 'Pantry',
  dal: 'Pantry',
  sugar: 'Pantry',
  salt: 'Pantry',
  oil: 'Pantry',
  tea: 'Pantry',
  coffee: 'Pantry',
  bread: 'Pantry',
  pasta: 'Pantry',
  biscuits: 'Pantry',
  cereal: 'Pantry',
  honey: 'Pantry',
  masala: 'Pantry',
  poha: 'Pantry',

  soap: 'Household',
  shampoo: 'Household',
  detergent: 'Household',
  toothpaste: 'Household',
  tissues: 'Household',
  bin: 'Household',
  bags: 'Household',
  batteries: 'Household',
  bulb: 'Household',
  foil: 'Household',
}

/** Leading quantity: "2 milk", "1kg atta", "500ml cream", "a dozen eggs". */
const QTY_PATTERN =
  /^((?:\d+(?:\.\d+)?\s?(?:kg|g|gm|grams?|l|ltr|litres?|liters?|ml|pcs?|packets?|dozen|boxes?|bottles?|cans?|loaves|loaf)?|a\s+dozen|half\s+a\s+dozen)\s+)/i

export interface Parsed {
  kind: ItemKind
  /** The text with quantity and any command prefix stripped off. */
  title: string
  qty?: string
  category?: GroceryCategory
  /** True when we're confident enough not to nag about the guess. */
  confident: boolean
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function categorise(name: string): GroceryCategory {
  const words = name.toLowerCase().split(/\s+/)
  for (const w of words) {
    const hit = CATEGORY_LEXICON[w.replace(/[^a-z]/g, '')]
    if (hit) return hit
  }
  return 'Other'
}

export function classify(raw: string): Parsed {
  const input = raw.trim()
  if (!input) {
    return { kind: 'grocery', title: '', confident: false }
  }

  // An explicit prefix always wins, e.g. "note: plumber comes friday".
  const prefix = input.match(/^(note|task|todo|buy|get|grocery|memory|moment)\s*[:—-]\s*(.+)$/i)
  if (prefix) {
    const body = prefix[2].trim()
    const key = prefix[1].toLowerCase()
    if (key === 'note') return { kind: 'note', title: body, confident: true }
    if (key === 'memory' || key === 'moment')
      return { kind: 'moment', title: body, confident: true }
    if (key === 'task' || key === 'todo')
      return { kind: 'task', title: titleCase(body), confident: true }
    return groceryFrom(body, true)
  }

  const lower = input.toLowerCase()
  const firstWord = lower.split(/\s+/)[0].replace(/[^a-z]/g, '')

  // "buy milk" / "get bananas" are groceries, not tasks: the thing is the point.
  if (firstWord === 'buy' || firstWord === 'get') {
    return groceryFrom(input.replace(/^\w+\s+/, ''), true)
  }

  if (ACTION_VERBS.includes(firstWord)) {
    return { kind: 'task', title: titleCase(input), confident: true }
  }

  // Long sentences are almost never shopping-list entries.
  const wordCount = input.split(/\s+/).length
  if (wordCount > 6) {
    return { kind: 'note', title: input, confident: false }
  }

  return groceryFrom(input, false)
}

function groceryFrom(text: string, confident: boolean): Parsed {
  let rest = text.trim()
  let qty: string | undefined

  const m = rest.match(QTY_PATTERN)
  if (m) {
    qty = m[1].trim()
    rest = rest.slice(m[0].length).trim()
  }

  const category = categorise(rest)
  return {
    kind: 'grocery',
    title: titleCase(rest),
    qty,
    category,
    // A lexicon hit means we actually recognise the thing.
    confident: confident || category !== 'Other',
  }
}
