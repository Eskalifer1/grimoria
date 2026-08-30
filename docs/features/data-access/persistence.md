# The optimistic store's persistence

Read this to **change how the overlay survives a reload, a second tab or a clock** —
`src/shared/lib/optimistic/persistence.ts`. The store's own shape, its slots and its transitions are
`docs/features/data-access/store.md`; why there is no queue is ADR-0012.

## Contents

- The slot
- Adding a field

## The slot

One `localStorage` slot, `grimoria:optimistic:v1`, holding every entry as one JSON document.

**The document names whose overlay it is.** One slot serves the whole browser, so a document carries
a `scope` — a User id, or `null` for nobody signed in — and is **read only under the scope that
wrote it**. `store.setScope(id)` is what names it: unchanged, it does nothing; changed, it drops a
document belonging to somebody else from the slot *and* from memory, then reads the slot again under
the new scope. Without it, the failure one User walked away from renders to the next one on the same
machine.

**The scope starts as `null` and something has to set it**, which is `useOptimisticScope` and the
`<OptimisticScope scope={...} />` leaf a Server Component drops in. It is mounted **once, in the
locale layout**, first in the JSX: React renders siblings in order, and the scope has to be set on
the render before the first surface reads the store, not in an effect after it. A surface that
mounts with no scope above it reads an empty store and writes under none — safe, but the overlay
does not survive a reload.

**Both the value and the error persist.** Leaving and returning restores what was typed *and* why it
failed. **An entry still in flight at load time becomes a failure**, coded `interrupted`. Pending in
the slot on a *cross-tab* read means a live request in another tab, so that read leaves it
pending — **unless it is past `OPTIMISTIC_REQUEST_TIMEOUT_MS`**, which the tab that issued it would
itself have given up on. No answer can reach a tab that never made the request, and nothing
reconciles or dismisses a pending entry.

**A settle writes at once; everything else is debounced and flushed when the page hides.** A tab
that closes, or another tab writing the slot, arrives well inside the debounce. `pagehide` and a
hidden `visibilitychange` cover the rest.

**A refused write puts the store in memory for good**, and `isPersisting()` answers false from then
on. Retrying would throw on every later write, and the overlay on screen is then a value that will
not survive a reload. No surface reads `isPersisting()` yet; #1 is where the first one could.

**A document from another schema version is discarded whole**; a single malformed entry takes only
itself down. Every field is narrowed on the way in rather than asserted.

**And it is dropped from the slot rather than left there.** Discarding on read alone leaves the
bytes holding quota until this tab happens to write, which for a route that mounts no optimistic
surface is never — so the slot is emptied at construction when what it holds is unreadable: another
schema version, or bytes that are not a document. A readable document under **another scope** is not
that: it belongs to a User who may sign back in, and dropping it is `setScope`'s decision.

**The snapshot React hydrates from is empty.** The store reads `localStorage` when the module is
imported, so by hydration the client already holds the overlay. `getServerSnapshot` returns
nothing, and the overlay lands on the render after.

**A pending entry is only kept over another tab's document when *this* tab issued it.** The store
holds the keys it has a write out on; an entry read out of the slot looks identical to one of ours,
and keeping it as ours would make this tab ignore the very document that settles it.

**Tabs sync through the `storage` event**, watched from the moment the store is built. A tab whose
route mounts no optimistic component still writes the document whole, so an unwatched one would put
its stale snapshot over every other tab's entries.

**A cross-tab read is merged, never adopted whole.** The other tab's document is the authority on
every key this tab has no write in flight on — which is what carries a dismissal across tabs. A key
this tab *is* writing stays this tab's: the other tab wrote its document before this write existed,
and adopting it would delete the entry, leaving the answer to be discarded against a key that is no
longer there. `latestCall` never travels in the document either; restarting it would let a
superseded answer land as the current one.

**An entry expires after `OPTIMISTIC_ENTRY_MAX_AGE_MS`** — seven days — measured from `touchedAt`,
which every transition refreshes, and dropped on the next hydration rather than on a timer. Measured
from the first write instead, a key busy for a week would expire the value typed into it a second
ago. A `touchedAt` further ahead than that window is a clock that cannot be reasoned about and the
entry goes; a smaller skew clamps to now.

**A write expires after `OPTIMISTIC_REQUEST_TIMEOUT_MS`** — thirty seconds — and settles as
`timedOut`. A Server Action cannot be cancelled and carries no deadline of its own, so a request
nobody answers would hold the row dim for the life of the tab. The request is not cancelled: a late
answer carries the same call number and settles on top.

## Adding a field

`OPTIMISTIC_ENTRY_PERSISTENCE` is `Record<keyof OptimisticEntry, boolean>`, so a new field on the
entry is a `tsc` error until it is given a persistence decision, and
`tests/shared/lib/optimistic/entry.test.ts` fails if the map drifts from the entry's runtime shape.

**A field persists when it is a fact, and does not when it is a guess.** `latestCall` is the one
`false`: no answer outlives the page that asked, so a fresh page restarts the numbering at zero.
