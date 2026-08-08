# Component conventions

> **Scope.** How a React component is built: which side of the server/client boundary it
> runs on, where its state lives, how it is split when it grows, how loading and failure are
> rendered, and how its file is written.
>
> *Where* a component file goes — folders, `index.tsx`, sub-component nesting, layers — is
> `general.md` §4. *How its types are written* is `typescript.md`. *How its copy is written*
> is `i18n.md`. Styling is `styling.md`.
>
> These are settled rules, not options. Where a rule is machine-enforced, the enforcing
> config is named — that config is the source of truth, not this document.
>
> Written before the first real components exist, against React 19 and the App Router rather
> than against our own code. Revisit once the site shell (#75) has landed.

---

## 1. The server/client boundary

Every component is a Server Component. `"use client"` is what you add when the component
genuinely needs the browser: state, effects, event handlers, refs, context, or a browser API.

### 1.1 The directive marks the leaf, not the branch

`"use client"` is not a property of one file. It opens a **boundary**: every module that file
imports joins the client bundle with it. So the directive goes on the file that first needs
the browser — pushed as far down the tree as it will go — and everything above it keeps
rendering on the server.

That includes non-components. A hook or a `lib/` helper that touches `useState` or `window`
carries the directive itself, rather than being marked indirectly by whichever component
imports it. Otherwise the boundary climbs on its own: the component gets the directive, and
then so does its parent.

### 1.2 `views/` stays on the server

A screen module is a composition root (`general.md` §3). Marking one `"use client"` pulls the
entire screen — every feature it composes, every entity component below them — into the
browser bundle in a single edit, and nothing fails: the page still renders, just larger and
later. That silence is why this is a rule rather than a preference.

### 1.3 Server data reaches a client leaf through a slot

When an interactive wrapper has to sit above server-rendered content, the content is passed
in as `children` or a `ReactNode` prop. React renders it on the server and hands the client
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

This is the same mechanism `general.md` §1.3 uses to keep features from importing each
other. One move, two reasons: it holds the layer boundary and the client boundary at once.

### 1.4 `server-only` and `client-only`

A module that must never reach the browser — Local API reads, a Data Access Layer, anything
reading a secret out of `process.env` — starts with `import 'server-only'`. Imported from a
client file, the build fails by name instead of shipping the module's contents to the
browser. `client-only` is the mirror, for a module that needs `window`, `document` or
`localStorage`.

Payload is embedded in this same Next.js app (ADR-0005), so a database read sits behind the
same `@/` alias as a button. The packages are what make that mistake loud.

`actions/` files need neither: `"use server"` already draws the boundary (`general.md` §5.1).

> The packages are installed with the first server module that needs them, in #75. Until
> then this section is the rule, with nothing yet to attach it to.

---

## 2. State

### 2.1 The ladder

Climb only when the rung below stops working.

1. **Local `useState`** — pure UI ephemera. A hover, an open menu, the text in an input
   before it is submitted. Nothing outside the component cares.
2. **Lifted to the nearest common parent** — two siblings need the same value. Lift to where
   they meet, not to the top of the screen.
3. **URL** — anything a user would expect to survive a reload, a back button, or a pasted
   link: filters, sort, pagination, an open detail panel. Read with `useSearchParams`, write
   with `router.replace(..., { scroll: false })` so the entry does not stack.
4. **Server cache** — anything mirroring data that lives in Postgres. It is not component
   state; it is a cached read with its own invalidation (#62).

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

> Which library manages URL state gets decided when there is a screen with real filters to
> decide it against (#4). Today the native hooks are the whole answer.

### 2.2 Derived values are computed, not stored

A value computable from props or state is computed during render. A value that changes
because the user did something is set in that event's handler.

```tsx
const visible = notes.filter((note) => note.status === status);   // ✓
```

`useEffect` is for synchronizing with something outside React — a subscription, a browser
API, a third-party widget — and it comes with a cleanup. Reaching for it to keep two pieces
of state in step means one of them is derived, and the fix is to delete it.

**Machine-enforced** — `correctness/useHookAtTopLevel` and `correctness/useExhaustiveDependencies`,
both `error` through Biome's `react` domain.

### 2.3 Memoization is added against a measurement

`useMemo` and `useCallback` are written when something is actually slow or a reference
actually has to stay stable across renders. Both cost a comparison on every render, and most
components never earn that back. When the reason is not obvious from the code, the comment
that says why is the point (`general.md` §11.1).

`useMemo` caches a **result**; `useCallback` caches a **function definition** and saves none
of the work of calling it.

### 2.4 Refs point down, never up

A ref reaches into the DOM or holds a value across renders without re-rendering. A ref used
to hand data back to a parent is state that belongs higher up — rung 2.

---

## 3. When a component grows

Three moves, in order of cost. Take the cheapest one that fits.

**Split into private sub-components.** The default. The extracted piece is a nested folder
inside the parent (`general.md` §4.3), and the split follows a seam that already exists: a
region of the markup with its own reason to change.

**Accept a slot.** When the parent should not know what goes inside it, it takes `children`
or a `ReactNode` prop instead of the data to build it (§1.3). This is what keeps a component
reusable across screens.

**Compound components.** The most expensive of the three, and the last resort — see §3.1.

**Machine-enforced** — `style/noExcessiveLinesPerFile`, `error`, 200 lines, on `views/`,
`features/`, `entities/` and our `shared/components/`. It is a smoke alarm, not the rule:
a file can be badly split at 120 lines and fine at 190. The rule is the seam.

### 3.1 Compound components

A compound component exposes its regions as properties — `Card.Header`, `Card.Body` — so the
consumer controls their order and which ones exist. It earns that complexity at **three or
more optional regions**. Below that, props are simpler for everyone.

The root file imports its sub-components and attaches them, keeping the file's single export
(`general.md` §10.3):

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
entirely on one side of it. A server root with a client `Header` is not this pattern — that
is §1.3, a slot.

---

## 4. Loading and failure

**`error.tsx` and `not-found.tsx` sit at the root of every route group.** Without them an
uncaught error or a missing record lands the user on a default Next.js screen that neither
Theme has designed. `error.tsx` carries `"use client"` in that exact file (`general.md` §2).

**`loading.tsx` goes where a segment actually waits on data**, and nowhere else. On a segment
with nothing to wait for it buys an empty frame.

**`<Suspense>` is the finer instrument.** `loading.tsx` replaces the whole segment, so a page
whose header is instant and whose list is slow renders nothing at all until the list
arrives. Wrapping the slow part instead lets the rest paint immediately:

```tsx
<NoteHeader note={note} />
<Suspense fallback={<NoteCommentsSkeleton />}>
  <NoteComments noteId={note.id} />
</Suspense>
```

The fallback holds the same space as the real content, so nothing jumps when it resolves.

---

## 5. The component file

One order, every time:

```tsx
'use client';                          // only when §1 calls for it

import { useState } from 'react';      // ordered by organizeImports

interface NoteCardProps { ... }        // typescript.md §2, §8

function formatCount(total: number) { ... }   // trivial, pure, local

function NoteCard({ note }: NoteCardProps) { ... }

export { NoteCard };                   // general.md §10.5
```

A local helper stays in the file while it is trivial, pure and used by this component alone —
the same allowance as `general.md` §10.3. Once it grows dependencies, a test, or a second
caller, it moves to the module's `lib/`.

Components are declared at the top level of the file. A component declared inside another is
a new component type on every render, which throws away its entire subtree's DOM and state.

**Machine-enforced** — `correctness/noNestedComponentDefinitions`, `error`.

---

## 6. Naming

`general.md` §8 covers the general rule: a name describes what the thing is or does. The
component layer adds four.

**`on` belongs to props.** A prop that hands a callback out is `onSelect`, `onDismiss`,
`onRetry`. A function inside a component that is wired to an event is `handleSelect`. The
prefix tells you which direction you are looking at without reading the type.

**A callback prop is named for the event, in the component's own vocabulary.** `onSelect`,
not `onOpenNote`; `onDismiss`, not `onCloseFilterPanel`. The test: would this name have to
change if a second screen used the component differently? If yes, it is describing the
parent's intent, and the parent's intent is not the component's business.

**Booleans carry `is`, `has`, `can` or `should`.** `should` for turning behavior on and off
(`shouldAutoFocus`), the others for describing state (`isOpen`, `hasError`, `canEdit`).

**Props types are `{ComponentName}Props`** — `typescript.md` §8.

The vendored zone (`shared/components/ui/**`, `general.md` §7.1) keeps whatever shadcn and
Radix generate. Their API is theirs.

---

## 7. Documenting props

A component's contract is its props interface, so that is where it is documented — not in a
JSDoc block above the component restating its name (`general.md` §11.3).

**Every prop carries a `/** */` block.** One line, above the prop, saying what the consumer
needs to know and cannot read off the type.

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

The universal props get one fixed wording each, so they are not reinvented per component:

```tsx
  /** The content to render inside <the region>. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;

  /** Forwarded to <the element the consumer needs to reach>. */
  ref?: Ref<HTMLDivElement>;
```

Optional props take their default in the destructuring, where it is visible in the signature
and needs no documenting:

```tsx
function NoteCard({ note, isCompact = false }: NoteCardProps) { ... }
```

This applies to every component we write. The vendored zone is exempt — we do not hand-edit
those files (`general.md` §7.1).

---

## 8. Writing the component

**Conditional markup uses a ternary closing on `null`.**

```tsx
{note.title ? <NoteTitle title={note.title} /> : null}     // ✓
{comments.length ? <CommentList items={comments} /> : null} // ✓
```

`&&` renders its left operand when that operand is falsy but not boolean, so
`{comments.length && <CommentList />}` prints a literal `0` on screen the moment the list is
empty. The same trap sits under `''`, and it passes review because it looks right.

**Components and module-level functions are declared with `function`.** It hoists, it reads
the same whether or not the body is one expression, and it is what React's own documentation
writes. Arrow functions stay where they belong — callbacks, inline handlers, short
expressions.

**Machine-enforced** — `style/useReactFunctionComponents`, `error`.

**React 19 removed the ceremony.** `ref` is a normal prop, so `forwardRef` is gone. Class
components are gone. A cross-cutting concern is a custom hook; a higher-order component is
the shape to move away from.

**Copy comes from `next-intl`** — `i18n.md`. Enforced by `style/noJsxLiterals`.

---

## 9. Where each rule is enforced

| Rule | Enforced by |
| --- | --- |
| Hooks at the top level (§2.2) | `correctness/useHookAtTopLevel`, `error` |
| Complete effect dependencies (§2.2) | `correctness/useExhaustiveDependencies`, `error` |
| No component inside a component (§5) | `correctness/noNestedComponentDefinitions`, `error` |
| Components declared with `function` (§8) | `style/useReactFunctionComponents`, `error` |
| File under 200 lines (§3) | `style/noExcessiveLinesPerFile`, `error`, our component paths |
| Exports collected at the end (§5) | `style/useExportsLast`, `error` — partly, `general.md` §10.5 |
| `interface` for props (§7) | `style/useConsistentTypeDefinitions`, `typescript.md` §2 |
| Copy through `next-intl` (§8) | `style/noJsxLiterals`, `error` |
| Boundary, state, composition, prop docs, ternaries | review, plus `.claude/rules/components.md` |

`yarn check` reports the lint rules; `yarn ci` fails on them.
