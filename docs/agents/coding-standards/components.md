# Component conventions

How a React component is built: which side of the server/client boundary it runs on, where
its state lives, how it splits when it grows, how loading and failure render, how its file is
written. _Where_ the file goes is `general.md`; types are `typescript.md`, copy is `i18n.md`,
styling is `styling.md`. Settled rules, not options; where one is machine-enforced the config
is named, and that config is the source of truth.

Written against React 19 and the App Router before the first real components exist. Revisit
once the site shell (#75) has landed.

## The server/client boundary

Every component is a Server Component. `"use client"` is what you add when it genuinely needs
the browser: state, effects, event handlers, refs, context, or a browser API.

**The directive marks the leaf, not the branch.** `"use client"` is not a property of one
file — it opens a boundary, and every module that file imports joins the client bundle with
it. So it goes on the file that first needs the browser, pushed as far down the tree as it
will go. That includes non-components: a hook or `lib/` helper touching `useState` or
`window` carries the directive itself, rather than being marked indirectly by whichever
component imports it. Otherwise the boundary climbs on its own.

**`views/` stays on the server.** Marking a screen module `"use client"` pulls every feature
it composes and every entity below them into the browser bundle in a single edit — and
nothing fails: the page still renders, just larger and later. That silence is why this is a
rule rather than a preference.

### Server data reaches a client leaf through a slot

When an interactive wrapper has to sit above server-rendered content, the content arrives as
`children` or a `ReactNode` prop. React renders it on the server and hands the client
component the finished output, so the data-fetching module never joins the client graph.

```tsx
// views/NotesListPage/index.tsx — server
<Collapsible summary={<NoteCount total={notes.length} />}>
  <NoteList notes={notes} />
</Collapsible>

// features/note/components/Collapsible/index.tsx
'use client';

interface CollapsibleProps {
  /** Always visible, and the control that toggles the rest. */
  summary: ReactNode;

  /** The content to render inside the collapsible region. */
  children: ReactNode;
}
```

This is the same mechanism that keeps features from importing each other (`general.md`). One
move, two reasons: it holds the layer boundary and the client boundary at once.

### `server-only` and `client-only`

A module that must never reach the browser — Local API reads, a Data Access Layer, anything
reading a secret out of `process.env` — starts with `import 'server-only'`. Imported from a
client file, the build then fails by name instead of shipping the module's contents to the
browser. `client-only` is the mirror, for a module needing `window`, `document` or
`localStorage`.

Payload is embedded in this same Next.js app (ADR-0005), so a database read sits behind the
same `@/` alias as a button. These packages are what make that mistake loud. `actions/` files
need neither — `"use server"` already draws the boundary.

The packages are installed with the first server module that needs them, in #75.

## State

Climb the ladder only when the rung below stops working.

1. **Local `useState`** — pure UI ephemera: a hover, an open menu, input text before
   submission. Nothing outside the component cares.
2. **Lifted to the nearest common parent** — two siblings need the same value. Lift to where
   they meet, not to the top of the screen.
3. **URL** — anything a user expects to survive a reload, a back button, or a pasted link:
   filters, sort, pagination, an open detail panel. Read with `useSearchParams`, write with
   `router.replace(..., { scroll: false })` so the entry does not stack.
4. **Server cache** — anything mirroring data in Postgres. Not component state; a cached read
   with its own invalidation (#62).

```tsx
'use client';

const searchParams = useSearchParams();
const router = useRouter();
const status = searchParams.get('status') ?? 'all';

function handleSelect(next: string) {
  const params = new URLSearchParams(searchParams);
  params.set('status', next);
  router.replace(`?${params}`, { scroll: false });
}
```

Which library manages URL state gets decided against a screen with real filters (#4). Today
the native hooks are the whole answer.

**Derived values are computed, not stored.** A value computable from props or state is
computed during render; a value that changes because the user did something is set in that
event's handler.

```tsx
const visible = notes.filter((note) => note.status === status);   // ✓
```

`useEffect` is for synchronizing with something outside React — a subscription, a browser API,
a third-party widget — and comes with a cleanup. Reaching for it to keep two pieces of state
in step means one of them is derived, and the fix is to delete it. Machine-enforced —
`correctness/useHookAtTopLevel` and `correctness/useExhaustiveDependencies`, `error`.

**Memoization is added against a measurement.** `useMemo` and `useCallback` are written when
something is actually slow or a reference actually has to stay stable across renders. Both
cost a comparison on every render and most components never earn it back; when the reason is
not obvious from the code, the comment saying why is the point. `useMemo` caches a **result**;
`useCallback` caches a **function definition** and saves none of the work of calling it.

**Refs point down, never up.** A ref reaches into the DOM or holds a value across renders
without re-rendering. A ref handing data back to a parent is state that belongs at rung 2.

## When a component grows

Three moves, in order of cost. Take the cheapest that fits.

**Split into private sub-components** — the default. The extracted piece is a nested folder
inside the parent, and the split follows a **seam** that already exists: a region of the
markup with its own reason to change.

**Accept a slot.** When the parent should not know what goes inside it, it takes `children`
or a `ReactNode` prop instead of the data to build it. This is what keeps a component
reusable across screens.

**Compound components** — the most expensive, and the last resort.

Machine-enforced — `style/noExcessiveLinesPerFile`, `error`, 200 lines, on `views/`,
`features/`, `entities/` and our `shared/components/`. It is a smoke alarm, not the rule: a
file can be badly split at 120 lines and fine at 190. The rule is the seam.

### Compound components

A compound component exposes its regions as properties — `Card.Header`, `Card.Body` — so the
consumer controls their order and which exist. It earns that complexity at **three or more
optional regions**; below that, props are simpler for everyone. The root imports its
sub-components and attaches them, keeping the file's single export:

```tsx
// shared/components/Card/index.tsx
import { CardBody } from './CardBody';
import { CardHeader } from './CardHeader';

interface CardProps {
  /** The card's regions, composed by the consumer. */
  children: ReactNode;
}

function CardRoot({ children }: CardProps) {
  return <section>{children}</section>;
}

const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });

export { Card };
```

`Object.assign` does not carry a client boundary across itself, so a compound component lives
entirely on one side of it. A server root with a client `Header` is not this pattern — that is
a slot.

## Loading and failure

**`error.tsx` and `not-found.tsx` sit at the root of every route group.** Without them an
uncaught error or a missing record lands the user on a default Next.js screen neither Theme
has designed. `error.tsx` carries `"use client"` in that exact file.

**`loading.tsx` goes where a segment actually waits on data**, and nowhere else. On a segment
with nothing to wait for it buys an empty frame.

**`<Suspense>` is the finer instrument.** `loading.tsx` replaces the whole segment, so a page
whose header is instant and whose list is slow renders nothing until the list arrives.
Wrapping the slow part lets the rest paint immediately:

```tsx
<NoteHeader note={note} />
<Suspense fallback={<NoteCommentsSkeleton />}>
  <NoteComments noteId={note.id} />
</Suspense>
```

The fallback holds the same space as the real content, so nothing jumps when it resolves.

## The component file

One order, every time:

```tsx
'use client';                          // only when the boundary calls for it

import { useState } from 'react';      // ordered by organizeImports

interface NoteCardProps { ... }

function formatCount(total: number) { ... }   // trivial, pure, local

function NoteCard({ note }: NoteCardProps) { ... }

export { NoteCard };
```

A local helper stays in the file while it is trivial, pure and used by this component alone —
the same allowance as `general.md`. Once it grows dependencies, a test, or a second caller, it
moves to the module's `lib/`.

**Components are declared at the top level of the file.** A component declared inside another
is a new component type on every render, which throws away its entire subtree's DOM and state.
Machine-enforced — `correctness/noNestedComponentDefinitions`, `error`.

## Naming

A name says what the thing is or does (`general.md`). The component layer adds four rules.

**`on` belongs to props.** A prop handing a callback out is `onSelect`, `onDismiss`,
`onRetry`; a function inside a component wired to an event is `handleSelect`. The prefix tells
you which direction you are looking at without reading the type.

**A callback prop is named for the event, in the component's own vocabulary.** `onSelect`, not
`onOpenNote`; `onDismiss`, not `onCloseFilterPanel`. The test: would this name have to change
if a second screen used the component differently? If yes, it describes the parent's intent,
and the parent's intent is not the component's business.

**Booleans carry `is`, `has`, `can` or `should`.** `should` turns behavior on and off
(`shouldAutoFocus`); the others describe state (`isOpen`, `hasError`, `canEdit`).

**Props types are `{ComponentName}Props`** (`typescript.md`).

The vendored zone keeps whatever shadcn and Radix generate. Their API is theirs.

## Documenting props

A component's contract is its props interface, so that is where it is documented — not in a
JSDoc block above the component restating its name. **Every prop carries a `/** */` block**:
one line, above the prop, saying what the consumer needs to know and cannot read off the type.

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

Optional props take their default in the destructuring, where it is visible in the signature
and needs no documenting: `function NoteCard({ note, isCompact = false }: NoteCardProps)`.

This applies to every component we write; the vendored zone is exempt, because we do not
hand-edit those files.

## Writing the component

**Conditional markup uses a ternary closing on `null`.**

```tsx
{note.title ? <NoteTitle title={note.title} /> : null}       // ✓
{comments.length ? <CommentList items={comments} /> : null}  // ✓
```

`&&` renders its left operand when that operand is falsy but not boolean, so
`{comments.length && <CommentList />}` prints a literal `0` on screen the moment the list is
empty. The same trap sits under `''`, and it passes review because it looks right.

**Components and module-level functions are declared with `function`.** It hoists, it reads
the same whether or not the body is one expression, and it is what React's own documentation
writes. Arrow functions stay in callbacks, inline handlers and short expressions.
Machine-enforced — `style/useReactFunctionComponents`, `error`.

**React 19 removed the ceremony.** `ref` is a normal prop, so `forwardRef` is gone. Class
components are gone. A cross-cutting concern is a custom hook; a higher-order component is the
shape to move away from.

**Copy comes from `next-intl`** (`i18n.md`), enforced by `style/noJsxLiterals`.
