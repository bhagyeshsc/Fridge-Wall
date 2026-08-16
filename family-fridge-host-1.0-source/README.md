# Family Fridge

The fridge door, on a screen. One place your whole family can see what needs
doing, what needs buying, and what's going on at home.

![The wall](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/01-hero.png)

## What it is

You know the fridge door. Notes under magnets, a shopping list, a school
letter, a photo from last summer. Everyone in the house walks past it and
just knows what's going on.

This is that, on a screen. Everything lives on **one page**. Nothing to log
into, nothing to navigate, no folders or tabs. You open a link and you're
looking at your family's fridge.

Anyone in the family can add or change anything, and everyone sees the same
thing.

---

## Setting up your fridge

Takes about a minute, once, for one person in the family.

### 1. Give it a name

Open the link and it asks what to call your fridge. Anything you'll
recognise.

![Naming your fridge](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/02-setup.png)

### 2. Add everyone

Type the names of the people who'll use it. You can add more later, so
don't overthink it.

![Adding the family](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/03-people.png)

### 3. Send everyone the link

The last step gives you a link. **That link is your fridge.** Send it to
your family however you normally message them.

Whoever opens it sees your fridge. No sign-up, no password, no app to
download.

![The invite link](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/04-invite.png)

> **Keep that link.** It's the only way back in. Save it, bookmark it, or
> add it to your home screen (see below). If you just open the plain website
> address later, you'll get a brand new empty fridge instead of yours.

---

## Using it

### Adding anything

One **+** button at the bottom handles everything. Type what's on your mind
and it works out what you meant. "Milk" goes on the shopping list. "Call the
plumber" becomes a job for someone. If it guesses wrong, tap the right one.

![Adding something](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/05-quickadd.png)

### Things to do

The big number at the top is how many things still need doing today. Tap the
circle next to a job when it's done and it ticks off and disappears.

Tap the little face on the right of a job to say who's doing it.

### The shopping list

Sorted into aisles so it matches how you actually walk round a shop. Tap
things off as you put them in the basket. Unlike jobs, shopping stays on
screen with a line through it, so you can see what you've already got, then
clear the whole lot in one tap when you're done.

![The shopping list](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/06-groceries.png)

### Notes

The stuff that isn't a job or shopping, but everyone should know. When the
plumber's coming. Which day school is shut.

![Notes](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/07-notes.png)

### Moments

A photo and a line about it. Swipe for the last few. It's meant to feel like
a page from a family album, not a camera roll.

![Today's moment](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/08-moment.png)

### Everyone in the family

Tap someone's name and the whole fridge quietly highlights just their
things, so you can see at a glance what's on M's plate today. Tap again to
go back to everyone.

![Highlighting one person](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/11-lens.png)

### Changing the family

Tap the pencil next to anyone to change their name, what you call them,
their phone number, or their colour. There's an **Add someone** button at the
bottom of the list, and an **Invite** button at the top to get the link
again for someone new.

![Editing a family member](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/10-edit.png)

### Who you are

Your name sits in the top right. Tap it to switch to someone else. This just
records who added what. There are no private lists, everyone sees everything.

### Put it on your home screen

So it opens like a normal app instead of a browser tab:

- **iPhone / iPad:** open the link in Safari, tap the share button, then
  **Add to Home Screen**
- **Android:** open the link in Chrome, tap the menu, then **Install app**
  or **Add to Home Screen**

This is worth doing on an old tablet propped up in the kitchen. The layout
opens out on a bigger screen so you can read it from across the room.

![On a tablet](https://raw.githubusercontent.com/bhagyeshsc/FridgeWall/main/screenshots/12-tablet.png)

---

## If something looks wrong

**"It's asking me to set up a new fridge."**
You've opened the plain website address instead of your family's link. Go
back to the link someone sent you, the long one. Ask them to send it again
if you've lost it.

**"I can't see what my partner just added."**
Everything updates by itself within a second or two. If it hasn't, close the
page and open it again.

**"I removed someone by accident."**
Add them back with **Add someone**. Anything that was assigned to them stays
on the fridge, it just won't have a name on it any more.

---
---

# The rest of it

Everything below is for anyone who wants to run their own copy, or is just
curious how it's built.

## What's in it

- **One canvas.** No routing, no separate screens. Every section is a zone
  on a single scrolling surface, and the bottom rail scrolls to a zone
  rather than navigating to one.
- **Quick Add** that classifies typed text into a task, grocery, note, or
  moment, with a one tap override.
- **Quantity and aisle parsing** for groceries, so "2 kg tomatoes" lands as
  Tomatoes, 2 kg, under Fruit & Veg.
- **A family lens** instead of a family screen. Tapping a person lifts their
  items across the whole wall and dims the rest.
- **Add, edit, and remove family members** in place, guarded so the last
  person can't be removed. Removing someone unassigns their tasks rather
  than deleting them.
- **First run onboarding** that names the household, adds the family, and
  hands over the invite link.
- **Cross device sync** with no login, where a private link is the key.
- **Installable** as a PWA, with an offline shell.
- **Ambient motion**, kept slow and small, and it respects
  `prefers-reduced-motion`.

## Roadmap

**v1.0** is everything described above. **v1.1**, PWA install support, is
done.

### v1.2: Voice input for Quick Add

Saying "add milk to groceries" out loud and having it become a structured
item. The text half of that already exists in `classify.ts`, so this wires
speech in front of it rather than redesigning it.

### v1.3: Real conflict resolution, if it turns out to matter

Today two simultaneous edits on different devices overwrite rather than
merge, a whole state last write wins. For a handful of people casually
adding milk and chores, collisions are rare and low stakes, so this is
deliberately conditional: worth doing once real use produces a collision
that actually stings. The fix is moving to a CRDT (Yjs or Automerge) that
merges per item instead of per save.

### v1.4: Household intelligence

- Grocery restock suggestions ("you usually buy milk every 5 days")
- Memory anniversaries ("1 year ago today")
- A gentle nudge for a task that has sat undone a while

### Deliberately not planned

- **A calendar.** This is exactly the feature that quietly turns a fridge
  into a generic productivity app. Only worth reconsidering with a genuinely
  strong case.
- **Per person logins.** The link is the key, on purpose. That is a product
  decision, not a missing piece.

Real photographs aren't tied to a version and can land whenever. Until then,
`MomentArt.tsx` draws flat geometric compositions, deliberately styled so
they read as intentional rather than as broken images. Swap that component
for an `<img>` when there are real photos.

## Running it locally

```bash
npm install
npm run dev
```

With no configuration at all it runs on browser storage alone and seeds a
sample family, which is the fastest way to poke at the design.

## Running your own copy for real

Three free accounts, no card needed for any of them.

### 1. Put the code on GitHub

Push it, or use GitHub's own uploader: open an empty repo, **Add file →
Upload files**, drag the files in, commit.

### 2. Point a host at it

| Host | Settings |
|---|---|
| **Cloudflare Pages** (recommended) | build command `npm run build`, output directory `dist` |
| **Netlify** | same build command and output directory |
| **Vercel** | auto-detects Vite, nothing to change |

That gives you a URL and rebuilds on every push.

### 3. Turn on sync

Without this the site works fine, but each device keeps its own private
copy. To make one shared fridge, create a free project at supabase.com, open
its **SQL Editor**, and run the contents of
[`supabase/schema.sql`](supabase/schema.sql) once.

Then copy **Project Settings → API → Project URL** and **anon public key**
into your host's environment variables as `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, and redeploy.

### How the access model works

The URL is the household. Opening the bare site mints a new `/w/<uuid>` and
rewrites the address bar, and that link is the only key.

The anon key ships in the built JavaScript, which is expected for an anon
key but still public. So the table has row level security on with **no
policies at all**, meaning the anon key gets zero direct access to it.
Everything goes through two `security definer` functions that each take a
wall id, so there is no way to ask the database "what walls exist" and read
somebody else's. That is what makes "private link" a real claim rather than
a decorative one.

Two honest limits:

- **No per person auth.** Anyone with the link is in. Fine for sharing
  inside a family, not fine if the link leaks somewhere public.
- **Last write wins.** See v1.3 above.

## Tech

React 18, Vite 6, TypeScript. Plain CSS with a custom property token layer,
no Tailwind, chosen for exact control over the editorial type scale and a
small dependency tree. Supabase is the only runtime dependency beyond React,
and the app runs fine without it.

```
src/styles/tokens.css     Every colour, size, space and duration. Start here.
src/styles/base.css       Reset, type roles, the 4-col / 12-col grid.
src/styles/wall.css       The wall and everything pinned to it.

src/lib/types.ts          Person, Task, GroceryItem, Note, Moment.
src/lib/store.ts          Reducer, the localStorage adapter, the sync engine.
src/lib/seed.ts           The sample family, used only without Supabase.
src/lib/classify.ts       Typed text into a structured item.
src/lib/wallId.ts         Resolves and mints the /w/<uuid> household id.
src/lib/supabase.ts       The client, inert with no env vars set.
src/lib/person.ts         Name into initials, and the accent colour cycle.
src/lib/pwa.ts            Runtime manifest and service worker registration.

src/components/Wall.tsx   The one canvas. Everything else hangs off it.
```

The install manifest is generated at runtime rather than served as a static
file, because its `start_url` has to be the current household. A fixed
manifest would install an icon that opens a brand new empty fridge instead
of the one you installed from.

## Design notes

- **Colour classifies, it never decorates.** Tasks coral, groceries butter,
  memories sky, family green, and that is the whole system. The wall is ink
  on warm cream otherwise. There is exactly **one** fully filled colour
  block, the things to do count, which is what makes it read as deliberate.
  Notes get no accent at all, because the palette only maps the four content
  types.
- **Cards and modules alternate on purpose.** Rounded cards (count, notes,
  moment) sit against thin bordered rectangles (groceries, family).
  Flattening that contrast flattens the whole thing.
- **Tasks vanish when checked, groceries do not.** A finished job should
  leave. A picked up grocery has to stay visible while you are still in the
  shop, so it goes struck through and clears in one action instead.
- **Motion is 180 to 240ms, ease out, no springs.** The ambient animation is
  deliberately slow and small enough to read as a living surface rather than
  something visibly animating.

## Credit

Built from a product and design specification, with one deliberate
departure: the spec described five sections behind a bottom nav, and this
is one canvas instead.
