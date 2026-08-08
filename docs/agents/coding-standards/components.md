# Component conventions

How a React component is built here. Where the file goes is `general.md`; types are
`typescript.md`, copy is `i18n.md`, styling is `styling.md`. Where a rule is machine-enforced
the config is named.

Written against React 19 before the first real components exist — revisit once the site shell
(#75) has landed.

## The server/client boundary

Every component is a Server Component. `"use client"` goes on the file that **first** needs the
browser, pushed as far down the tree as it will go — including non-components: a hook or `lib/`
helper touching `useState` or `window` carries the directive itself, or the boundary climbs on
its own.

**`views/` stays on the server.** Marking a screen module `"use client"` pulls every feature it
composes into the browser bundle in one edit — and nothing fails: the page still renders, just
larger and later. That silence is why this is a rule rather than a preference.

**Server data reaches a client leaf through a slot.** An interactive wrapper takes `children`
or a `ReactNode` prop, so React renders the content on the server and the data-fetching module
never joins the client graph. Same mechanism that keeps features from importing each other:
one move holding the layer boundary and the client boundary at once.

```tsx
// views/NotesListPage/index.tsx — server
<Collapsible summary={<NoteCount total={notes.length} />}>
  <NoteList notes={notes} />
</Collapsible>
```

**`server-only` and `client-only`.** A module that must never reach the browser — Local API
reads, a DAL, anything reading `process.env` — starts with `import 'server-only'`, so a client
import fails the build by name instead of shipping the module to the browser. Payload is
embedded in this same app (ADR-0005), so a database read sits behind the same `@/` alias as a
button; the package is what makes that mistake loud. `actions/` files need neither.

The packages land with the first server module that needs them, in #75.

## State

Climb only when the rung below stops working.

1. **Local `useState`** — UI ephemera nothing outside the component cares about.
2. **Lifted to the nearest common parent** — where the two siblings meet, not the top of the
   screen.
3. **URL** — anything a user expects to survive a reload, a back button, or a pasted link:
   filters, sort, pagination, an open detail panel. Write with
   `router.replace(..., { scroll: false })` so entries do not stack.
4. **Server cache** — anything mirroring Postgres. Not component state; a cached read with its
   own invalidation (#62).

Which library manages URL state is decided against a screen with real filters (#4); today the
native hooks are the whole answer.

**Derived values are computed during render, never stored.** Reaching for `useEffect` to keep
two pieces of state in step means one is derived, and the fix is to delete it — `useEffect` is
for synchronizing with something outside React, with a cleanup. Machine-enforced:
`correctness/useHookAtTopLevel`, `correctness/useExhaustiveDependencies`.

**Memoization is added against a measurement**, not by default, and the comment saying why is
the point. **Refs point down, never up** — a ref handing data back to a parent is state
belonging at rung 2.

## When a component grows

Three moves, cheapest first:

- **Split into private sub-components** (the default) along a **seam** that already exists: a
  region of markup with its own reason to change.
- **Accept a slot** when the parent should not know what goes inside it.
- **Compound components** — last resort, earning their complexity at **three or more optional
  regions**. Below that, props are simpler.

Machine-enforced — `style/noExcessiveLinesPerFile`, 200 lines, on `views/`, `features/`,
`entities/` and our `shared/components/`. It is a smoke alarm, not the rule: a file can be
badly split at 120 lines and fine at 190. **The rule is the seam.**

```tsx
// shared/components/Card/index.tsx — the root attaches its regions, keeping one export
const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });
```

`Object.assign` carries no client boundary across itself, so a compound component lives
entirely on one side of it. A server root with a client `Header` is a slot, not this pattern.

## Loading and failure

- **`error.tsx` and `not-found.tsx` at the root of every route group** — without them an
  uncaught error or missing record lands on a default Next.js screen neither Theme designed.
- **`loading.tsx` only where a segment actually waits on data**; elsewhere it buys an empty
  frame.
- **`<Suspense>` is the finer instrument.** `loading.tsx` replaces the whole segment, so a page
  with an instant header and a slow list renders nothing until the list arrives. Wrap the slow
  part instead, with a fallback holding the same space so nothing jumps.

## The component file

```tsx
'use client';                          // only when the boundary calls for it

import { useState } from 'react';      // ordered by organizeImports

interface NoteCardProps { ... }

function formatCount(total: number) { ... }   // trivial, pure, local

function NoteCard({ note }: NoteCardProps) { ... }

export { NoteCard };
```

A local helper stays while it is trivial, pure and used by this component alone; once it grows
dependencies, a test, or a second caller it moves to the module's `lib/`.

**Components are declared at the top level** — one declared inside another is a new component
type every render, discarding its subtree's DOM and state. Machine-enforced
(`correctness/noNestedComponentDefinitions`).

## Naming

- **`on` belongs to props** (`onSelect`); a function wired to an event inside a component is
  `handleSelect`.
- **A callback prop is named for the event in the component's own vocabulary** — `onSelect`,
  not `onOpenNote`. The test: would this name have to change if a second screen used the
  component differently? Then it describes the parent's intent, which is not the component's
  business.
- **Booleans carry `is`, `has`, `can` or `should`** — `should` turns behavior on and off
  (`shouldAutoFocus`), the others describe state (`isOpen`).
- **Props types are `{ComponentName}Props`.**

The vendored zone keeps whatever shadcn and Radix generate.

## Documenting props

A component's contract is its props interface, so that is where it is documented — not a JSDoc
block above the component restating its name. **Every prop carries a one-line `/** */` block**
saying what the consumer cannot read off the type.

```tsx
interface NoteCardProps {
  /** The note to render. */
  note: Note;

  /** Rendered in the card's footer — the author chip, when a screen has one. */
  author?: ReactNode;

  /** Fires once the card's own collapse animation has finished. */
  onExpanded?: () => void;
}
```

The universal props take one fixed wording each, so they are not reinvented per component:

```tsx
  /** The content to render inside <the region>. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;

  /** Forwarded to <the element the consumer needs to reach>. */
  ref?: Ref<HTMLDivElement>;
```

Defaults go in the destructuring, visible in the signature and needing no documentation. The
vendored zone is exempt — we do not hand-edit those files.

## Writing the component

**Conditional markup closes on `null`**, because `&&` prints a literal `0` on an empty list and
passes review looking right:

```tsx
{comments.length ? <CommentList items={comments} /> : null}
```

**Components and module-level functions use `function`**; arrows stay in callbacks and short
expressions. Machine-enforced (`style/useReactFunctionComponents`).

**Copy comes from `next-intl`** (`i18n.md`), enforced by `style/noJsxLiterals`.
