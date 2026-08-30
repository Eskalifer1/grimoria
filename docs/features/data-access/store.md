# The optimistic store

Read this to **change** `src/shared/lib/optimistic/store.ts`. To *use* it, read the pattern file for
the surface you are building (`docs/features/data-access.md`). How the overlay survives a reload, a
second tab or a clock is `docs/features/data-access/persistence.md`. Why a first-party store rather
than TanStack Query is ADR-0011; why there is no queue is ADR-0012.

## Contents

- The modules
- The entry
- The four slots
- Ordering
- Lifecycle

## The modules

| Module | Holds |
| --- | --- |
| `src/constants/optimistic.ts` | `PENDING_ACTION`, the storage key, the schema version, every duration, `OPTIMISTIC_ERROR` |
| `src/shared/lib/optimistic/entry.ts` | The entry's shape and its three guards. What is stored, and nothing about how it moves |
| `src/shared/lib/optimistic/transitions.ts` | Every move one entry can make, as pure functions |
| `src/shared/lib/optimistic/entries.ts` | The moves that are about the *collection*: expiry, the deadline, the cross-tab merge |
| `src/shared/lib/optimistic/calls.ts` | Which answer is still the current one, per key and per field |
| `src/shared/lib/optimistic/persistence.ts` | Serializing to and hydrating from one JSON document |
| `src/shared/lib/optimistic/slot.ts` | The `localStorage` slot, the debounce, the scope, and both window seams |
| `src/shared/lib/optimistic/store.ts` | The keyed state, the subscription, and the verbs — and nothing else |
| `src/shared/lib/optimistic/read.ts` | Reading an entry the way a surface renders it |
| `src/shared/lib/optimistic/list.ts` | Merging the overlay into a server-rendered list |

**Every verb is `update(key, apply)`** — read the key, apply a transition, publish what changed.
The expiry sweep and the persistence are written once, in that one function, rather than per verb.

**`createOptimisticStore` is a factory, and `optimisticStore` is the singleton the app reads.** A
test builds its own with `storage`, `now`, `debounceMs` and `watchExternal` injected.

## The entry

**One key per logical unit** — `note:<uuid>`, `user:<uuid>`. Field granularity lives inside the
entry so one subscription answers "is anything on this record pending?".

**The value is a patch, never an entity.** Changed fields only, overlaid on the server's value at
render.

**An error is a code, never a sentence.** Copy is produced at render, per Theme × locale. A failure
carries the **attempt** — the call number that recorded it — which is what lets a field dismissal
find the record's copy of that same failure and leave another field's alone. The record holds one
failure (`error`) and each field holds its own (`fieldErrors`); an answer replaces what the previous
attempt recorded, so a key holds one at a time.

**A retry does not clear the failure — its answer does.** Cleared when the retry opens, the message
leaves the screen for the length of a round trip and an identical one comes back: the User is told
nothing happened, and the surface shifts twice for it. The row is dim and the reason still under it
until the server says otherwise.

**`sourceVersion` must be a moving value** — an `updatedAt`, not an id. An id says "same row", not
"same truth", and pins the old value on screen for as long as the row keeps its id.

## The four slots

`optimisticData` on `begin`; `successData`, `failureData` and `finallyData` on the settles. All
optional.

**There is no automatic rollback.** `settleFailure` takes `rollback`, a list of fields it hands back
to the server by dropping them from the patch — cheaper than naming the old value in `failureData`,
because the render already has it. `useOptimisticValue` asks for it as `onFailure: 'rollback'`.

**`isSilent` records no reason.** `error` belongs to the record, so a reason left there is read by
every surface on that key, whether or not it wrote anything. A silent write settles with `rollback`
and `isSilent` together and leaves the key exactly as it found it — that is pattern A, and
`settleFailure` deletes the entry when nothing is left to hold.

**On success the server's response is applied first, then `successData` on top, then
`finallyData`.** A slot written by hand still beats the server's own value on the same field.

**A settle names the fields it owns.** `runOptimistic` passes them; a field it did not name is left
in flight, and `pendingAction` becomes whatever is still out rather than nothing.

## Ordering

**`begin` answers a call number and the matching settle must carry it.** The store keeps the latest
per key and per field; a settle behind the write that replaced it changes nothing at all — no data,
no error.

**The counter belongs to the store, and nothing resets it — `clearAll` included.** Numbered per
entry it restarts whenever an entry dies, and a request still in flight against the old entry comes
back carrying a number the new one accepts as its own. A `begin` also starts above the entry's own
number, since an entry adopted from another tab carries that tab's counter.

**Two concurrent writes to one key are ordered per field.** A second field opening a write says
nothing about the first field's answer: it lands, and its own marker is the only one it retires. Two
writes on the *same* field are still ordered against each other, and the older answer is discarded
whole.

**An answer whose fields only partly overlap a newer write is settled in half.** `ownedByCall`
answers the fields the call still owns and the fields it has lost, and a settle retires and files
against the first and writes none of the second — a write over `title` and `body` that a later
`title`-only write overtook still settles `body`, and putting `title` back would show the value the
User has already replaced. Whole-or-nothing gets this wrong in both directions: discarded, `body`
stays in flight forever; accepted, `title` reverts.

**A write that names no field — a delete, a whole-row insert — is ordered against the key.** There
is no field to measure it by, so `latestCall` decides.

## Lifecycle

| Event | What happens |
| --- | --- |
| `begin` on a key that already has an entry | Merges: two fields of one form stand together, the same field is last-write-wins. **It also clears what the last attempt on those fields refused** — a reason describes the attempt that filed it, and left up it reads as the answer to the write now in flight. A failure filed against a field this write does not name stays, and the record's copy stays with it. |
| `settleSuccess` | Slots applied, `sourceVersion` adopts the server's. Only the fields this answer named are retired — their flight state and the failures they filed — since another field's write may still be out. The entry stays until the server render catches up, and is deleted outright when the success left nothing to overlay. |
| `settleFailure` | Flight state cleared, the code recorded unless `isSilent`; the optimistic value stands unless `failureData` replaces it or `rollback` drops it. |
| `settleFailure` filing | The reason goes under every field the write owned, not only the fields the server named — that is what says whose failure it is, so an answer on another field leaves it standing. `fieldError` renders only what names its own field. |
| `dismiss` | Throws the attempt away — the failure **and** the value it belongs to. A dismissed failed `add` removes its row; a dismissed failed `update` falls back to the server's value. Naming a field dismisses **that field's** value and failure, never the record's — the record's copy goes with it when the two share an attempt, and also when the record holds no field failures at all, since the reason is then on screen under that field and nowhere else. A failure from another attempt stays. |
| The sweep | Runs on every change, not only on a page load. An entry past its age is dropped and a write past its deadline becomes `interrupted`, so a tab left open does not hold an attempt nobody came back to for its whole life. |
| The deadline | One timer, armed at the moment the next write runs out of time. A write this tab issued carries its own deadline in `runOptimistic`; one adopted from a tab that has since died carries none, and without the timer it stays dim for the life of the tab. |
| `setScope` | Names whose overlay this is (`persistence.md`). |
| `reconcile(key, serverVersion)` | The overlay dies once the render catches up, comparing the two versions as instants rather than as text so two spellings of one moment agree. **An entry with no version is never superseded** — there is no render for it to have caught up with, so it ends at a dismissal or at its age, which is what makes `version` worth passing. **A write in flight is never superseded**, or a revalidation would be how the User finds out their save was lost — and neither is a write that failed, since the server holds the value it always held and there is nothing to have caught up with. A dismissal is the only thing that throws a refused value away. |
| `clearAll` | The session wipe. Synchronous, and it cancels the debounced write so nothing is rewritten after the wipe. |

**An entry with nothing pending, no error and an empty patch is deleted, not kept empty.**
`isEntryLive` is the single test, and **every transition returns `OptimisticEntry | null`**, where
`null` means "delete me" — one contract across all of them. The shape and its three guards are
`entry.ts`; every move an entry can make is `transitions.ts`, so neither file has
to be read to follow the other.

**A store built through the factory is destroyed through `destroy`.** It watches the `storage` event
and the page unload from construction, and a store nobody holds keeps answering both — which in a
test run is every store the run ever built.

