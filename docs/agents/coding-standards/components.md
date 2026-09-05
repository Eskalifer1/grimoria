# Component conventions

How a React component is built here. Where the file goes is `layers.md` and `naming.md`; types
are `typescript.md`, copy is `i18n.md`, styling is `styling.md`. Where a rule is machine-enforced
the config is named.

## Contents

- The server/client boundary
- State
- When a component grows
- Loading and failure
- The component file
- Naming
- Documenting props

## The server/client boundary

Every component is a Server Component. `"use client"` goes on the file that **first** needs the
browser, pushed as far down the tree as it will go — including non-components: a hook or `lib/`
helper touching `useState` or `window` carries the directive itself, or the boundary climbs on
its own.

**`views/` stays on the server.** Marking a screen module `"use client"` pulls every feature it
composes into the browser bundle in one edit — and nothing fails: the page still renders, just
larger and later.

**Server data reaches a client leaf through a slot.** An interactive wrapper takes `children` or a
`ReactNode` prop.

**`server-only` and `client-only`.** A module that must never reach the browser — Local API reads,
a DAL, anything reading `process.env` — starts with `import 'server-only'`. A `"use server"` file needs
neither.

## State

Climb only when the rung below stops working.

1. **Local `useState`** — UI ephemera nothing outside the component cares about.
2. **Lifted to the nearest common parent** — where the two siblings meet, not the top of the screen.
3. **URL** — anything a user expects to survive a reload, a back button, or a pasted link: filters,
   sort, pagination, an open detail panel. Write with `router.replace(..., { scroll: false })` so
   entries do not stack. Which library manages URL state is decided against a screen with real
   filters (#4); today the native hooks are the whole answer.
4. **Server cache** — anything mirroring Postgres. Not component state; a read on the server and a
   write through a Server Action, `docs/features/data-access.md`. Revalidation becomes tag-based
   with Cache Components (#95).

**A value owned outside the component is followed, never copied.** Seeding local state from a prop,
or a form library's fields from a one-shot `defaultValues`, reads the source once. Read the value on
every render, or hand the library its reactive entry point (`values`, not `defaultValues`).

**Follow a source only where something outside will actually answer with the value; otherwise take a
seed.** Bound to a source nothing ever moves, the component is dragged back to what it held before
its own write. Who owns the write owns the value:
`docs/features/forms.md` decides it per write pattern.

**State that shadows the server is written together with the rule that retires it.** A local
overlay, a row hidden after a delete, a value held while a save is out — each is a claim the server
has not made, and the read that disproves it is what ends it.

**Derived values are computed during render, never stored.** Reaching for `useEffect` to keep two
pieces of state in step means one is derived, and the fix is to delete it. Machine-enforced:
`correctness/useHookAtTopLevel`, `correctness/useExhaustiveDependencies`.

**The React Compiler memoizes for us** — `reactCompiler: true` in `next.config.ts`, and the
`component` project in `vitest.config.ts` runs tests through it so a test asserts what ships. A
component or hook written plainly comes out memoized, so `useMemo`, `useCallback` and `memo` are not
written by hand; one added anyway is added **against a measurement**. **The compiler skips what it
cannot lower, silently** — a default in a destructured parameter (`{ compare = Object.is }`) costs
the whole function its memoization, so default in the body instead.

**A live nested read never goes in the same allocation as the object it hangs off.**
`{ form, isPending: form.formState.isSubmitting }` collapses to a dependency on `form` alone, and a
library handing back one object for the component's life then freezes the value forever. The read is
safe on its own, and safe in an allocation `form` is not part of — so return the object and let the
caller read through it.

**Refs point down, never up** — a ref handing data back to a parent is state belonging at rung 2.

## When a component grows

Three moves, cheapest first:

- **Split into private sub-components** (the default) along a **seam** that already exists: a region
  of markup with its own reason to change.
- **Accept a slot** when the parent should not know what goes inside it.
- **Compound components** — last resort, earning their complexity at **three or more optional
  regions**. The root attaches its regions to keep one export
  (`Object.assign(CardRoot, { Header: CardHeader })`), which carries no client boundary across
  itself, so a compound component lives entirely on one side of it; a server root with a client
  `Header` is a slot, not this pattern. **Where the root is a named region itself** — `Form.Root`
  beside `Form.Field` — the family is a plain object instead (`const Form = { Root, Field, … }`), so
  there is one way to write the root rather than two. The rule either way is **one export**.

**A control the form layer already binds is reached for by name**, and one it does not is built on
`Form.Field` rather than on a second copy of its wiring — `docs/features/forms.md`.

Machine-enforced — `style/noExcessiveLinesPerFile`, 200 lines, on `views/`, `features/`,
`entities/` and our `shared/components/`. It is a smoke alarm, not the rule. **The rule is the seam.**

## Loading and failure

**A failure that has not happened takes no space.** Nothing is held under a control for a message it
will most likely never be given — the write is expected to land, and an empty line under every row
and every field is paid on every render for something rare. The message region is still mounted from
the first render, because a `role="alert"` built at the moment it has something to say is never
spoken; empty, it has no height.

**A block that replaces a surface does not resize it.** It shares a grid cell with the surface so the
box is sized by the tallest state, `invisible` and `inert` rather than unmounted — and once it has
taken over, it is not handed back until an answer lands. Measured with `PerformanceObserver` on
`layout-shift`.

- **`error.tsx` and `not-found.tsx` at the root of every route group** — without them an uncaught
  error or missing record lands on a default Next.js screen neither Theme designed.
- **`loading.tsx` only where a segment actually waits on data**; elsewhere it buys an empty frame.
- **`<Suspense>` is the finer instrument.** Wrap the slow part
  instead, with a fallback holding the same space so nothing jumps.

## The component file

Order: `'use client'` when the boundary calls for it → imports → props interface → trivial pure
local helpers → the component → `export { NoteCard }`. A local helper stays while it is trivial,
pure and used by this component alone; once it grows dependencies, a test, or a second caller it
moves to the module's `lib/`.

**Components are declared at the top level**
(`correctness/noNestedComponentDefinitions`).

**Props are destructured in the signature**, however many there are — the type already lists them,
and `props.x` at each use reads as a second name for the same thing. **A namespace is for an object
whose name carries meaning**: a hook's return (`status.isPending`, `displayName.value`) says where
the value came from, which a bare `isPending` does not.

**Conditional markup closes on `null`**, because `&&` prints a literal `0` on an empty list: `{comments.length ? <CommentList items={comments} /> : null}`.

**Components and module-level functions use `function`**; arrows stay in callbacks and short
expressions (`style/useReactFunctionComponents`). **Copy comes from `next-intl`** (`i18n.md`),
enforced by `style/noJsxLiterals`.

## Naming

- **`on` belongs to props** (`onSelect`); a function wired to an event inside a component is
  `handleSelect`.
- **A callback prop is named for the event in the component's own vocabulary** — `onSelect`, not
  `onOpenNote`. The test: would this name have to change if a second screen used the component
  differently? Then it describes the parent's intent, which is not the component's business.
- **Booleans carry `is`, `has`, `can` or `should`** — `should` turns behavior on and off
  (`shouldAutoFocus`), the others describe state (`isOpen`).
- **A prop mirroring a native attribute of the control it configures keeps that attribute's name** —
  `required`, `disabled`, `readOnly`. Renaming it to `isRequired` puts two names on one thing and
  breaks the spread onto the element.
- **Props types are `{ComponentName}Props`.**

The vendored zone keeps whatever shadcn and Radix generate.

## Documenting props

**A component wrapping another derives its props from the one it wraps** — `interface ErrorRowProps
extends Omit<MessageRowProps, 'sentences'>`, with `Pick`, `Omit` and `Partial` for the parts that
differ. Retyping them puts a second copy of the contract one file away from the first, and the two
drift on the next prop added to the inner component.

**Every prop carries a one-line `/** */` block**
saying what the consumer cannot read off the type (`/** Rendered in the card's footer — the author
chip, when a screen has one. */`). Defaults go in the destructuring.

The universal props take one fixed wording each:

```tsx
  /** The content to render inside <the region>. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;

  /** Forwarded to <the element the consumer needs to reach>. */
  ref?: Ref<HTMLDivElement>;
```

The vendored zone is exempt — we do not hand-edit those files.
