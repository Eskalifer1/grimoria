# The optimistic hooks and the per-action descriptor

Read this to **build a surface on the optimistic store**, or to add a descriptor to an action. The
store itself is `docs/features/data-access/store.md`; which pattern a surface is at all is
`docs/features/data-access.md`.

## Contents

- The descriptor
- Nobody names a key
- The hooks
- Running a write
- Reading an entry
- What the list holds that the store does not

## The descriptor

One file inside each action's folder, `src/api/<domain>/<action>/optimistic.ts`, declaring what only the
action knows:

| Field | Answers |
| --- | --- |
| `run` | The action itself, so a call site hands over an input and never a key |
| `pending` | Which of `add`, `update`, `delete` this is — what a row renders flight and failure from |
| `key` | The key this write addresses, built from the action's own input |
| `value` | Where in the server's answer the value lives. Absent when there is nothing to overlay |
| `version` | The `updatedAt` the answer carries, which dates the entry against later renders |

`optimisticDescriptor()` infers both type parameters from `run`, so `key` and `value` are checked
against that action's input and result rather than against `unknown`.


## Nobody names a key

**A call site never writes a key, and never touches the store.**

Enforced twice: `biome.json` bans `@/shared/lib/optimistic/store` and `@/shared/lib/optimistic/run`
from `app/`, `views/`, `features/` and `entities/`, and
`tests/shared/lib/optimistic/storeBoundary.test.ts` fails when any file outside the hooks imports the
store. The key **format** is enforced the same way: `tests/api/user/userOptimisticKeys.test.ts` fails
when any file but `src/api/user/userOptimisticKeys.ts` opens a string with `user:`.

## The hooks

| Hook | For |
| --- | --- |
| `useOptimisticSubject` | The half every write shares: subscribe to the key, reconcile, write through the descriptor. Not used directly |
| `useOptimisticValue` | One field, one write. The shape a single-field form copies |
| `useOptimisticRecord` | A whole record: several fields, per-field flight state, per-field failures |
| `useOptimisticList` | A collection: optimistic insert, optimistic removal, merged with the server's list |
| `useOptimisticEntry` | One key, read-only, for a component that only displays |
| `useBrickRoad` | "Is there a problem below this point, and where is it" |
| `useOptimisticStore` | The store this part of the tree writes through. The singleton unless a provider says otherwise |
| `useOptimisticScope` | Names whose overlay the store may hold, so one browser does not serve two Users |
| `useOptimisticReset` | Wipes every overlay synchronously, the seam a screen resets through. Nothing calls it until sign-out lands (#1) |
| `useLastSettledStatus` | How the last write that finished ended, while the next is still out — a first attempt read apart from a retry |
| `useIsOffline` | The browser's own answer, signage only: a write still goes out and still fails |

**`useOptimisticValue` and `useOptimisticRecord` are two readings of one subject.** They differ only
in how the entry is shaped into props — one field or all of them — so the subscription, the
reconcile and the write are written once in `useOptimisticSubject`.

**The descriptor decides what the input is, not the call site.** `input` is `NoInfer`, so passing
the id alone does not narrow the shape to `{ id }` and leave no field nameable.

**A hook reaches the store through `useOptimisticStore`, never through the module.** The context is
defaulted to the singleton, so nothing has to provide one; providing one is how a test renders a tree
against a store of its own rather than against global state every case has to remember to wipe.

**`<OptimisticScope>` is mounted once, in the locale layout**, above everything and before it in the
JSX. Siblings render in order, and the scope has to be set on the render before the first surface
reads the store (`store.md`). No page mounts its own.

**`"use client"` sits on the hook file, not on the screen that uses it**, so the boundary does not
climb into `views/` (`components.md`).

**Every hook takes the server's value as a prop** and overlays the store on top of it.

**`useOptimisticValue` and `useOptimisticRecord` reconcile in an effect**, handing the store the
version the server just rendered. That is the only path by which a settled entry dies — **so a
surface that passes no `version` keeps its overlay until a dismissal or its age**.

## Running a write

`runOptimistic` is the whole path, and has no React in it: open the write on the descriptor's key,
await the answer, settle it under the call number that opened it, hand the result back.

**A broken request settles as `unexpected` rather than throwing, and the original is logged.**

**The answer is returned as well as stored**.

## Reading an entry

`src/shared/lib/optimistic/read.ts` holds the four questions a surface asks of an entry, so a hook is
a subscription and a merge and nothing else: `entryError` and `fieldError` (above the form versus
beside the input — the split `error` and `fieldErrors` exist for), `fieldPending`, and `entryStatus`.

**`fieldError` answers only what the server named that field for.** A failure is filed under every
field its write owned so an answer on another field knows to leave it alone; that copy is
bookkeeping, and a reason the server never tied to this input does not belong beside it.

**A write that claimed no fields covers the whole record.** A delete owns its row, not one of its
values, so every field of it reads as in flight.

**Flight beats a failure.** A retry already under way is not a problem to report.

**A patch value of the wrong shape is ignored.** A persisted document can outlive the shape it was
written under, and rendering a number where a string belongs is a crash the User cannot dismiss.
**`null` on either side passes**: an empty nullable field renders as `null` and clearing one stores
`null`, and measured by `typeof` both read as `'object'` — so the check would drop every overlay on
a nullable field, in silence.

## What the list holds that the store does not

`useOptimisticList` keeps one thing in component state: which rows the server has agreed to drop.

**A draft is a patch that keys back to its own entry.** A field write on the same record leaves
changed fields only, which has no id and keys back to nothing.

**A dropped key is held only until a read comes back without it.** Held past that, it hides the next
row to arrive under the same id — a re-seed, a restore, an undo.

**A draft is rebuilt from the store, not held in state.** The whole row travels as the write's
optimistic value, so a create that failed still has its content on screen after a reload — the
promise every other write already made. Held in state it survived nothing, and the failure came back
as a message with no row under it.

**A list takes a `version`.** Without one a confirmed row's overlay is never retired and the whole
row sits in `localStorage` until the entry expires. It is the same `updatedAt` the other hooks take.

**`onFailure` picks what a refusal leaves behind.** `keep` is the default and pattern B. `rollback`
hands the field back to the server and still says why. `silent` rolls back and records nothing,
which is pattern A.

