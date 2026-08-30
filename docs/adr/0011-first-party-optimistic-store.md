# A first-party optimistic store, not TanStack Query

Optimistic writes are held in `optimisticStore` — a plain module read through
`useSyncExternalStore`, persisted to `localStorage`. TanStack Query is not adopted, and the issues
that planned it (#50, #62) are closed against this decision.

TanStack Query solves fetching against a remote HTTP API: caching, deduplication, background
refetching, and — almost incidentally — optimistic mutations. Payload is embedded in this app. Reads
happen in Server Components through the Local API, which is a function call rather than a request,
and writes happen through Server Actions. There is no client-side fetching layer for a fetching
library to own. Adopting it for its mutation half would mean running a second write path beside
Server Actions, and every new screen would start with "which one here?".

What is actually needed is smaller and has no library: a keyed place to hold a value that is true on
the screen before it is true in the database, that survives unmounting and navigation, and that
carries an error the User can still see after they have walked away and come back. React 19's
`useOptimistic` covers none of that — it lives and dies with the component that owns it.

## Rejected

- **TanStack Query's mutation cache** — the closest fit, and rejected for the reason above: it
  arrives attached to a query layer this app does not have.
- **TanStack DB** — the nearest thing that exists, and the one a reader will ask about: optimistic
  mutations, transactions, an error per transaction, `localStorage` collections. It rolls a failure
  back, which is the opposite of the rule this store is built around, and it holds a transaction in
  memory, so a reload loses the error its collections were never persisting. It is a client store
  besides, and putting the reads on the client is what disqualified TanStack Query above.
- **Zustand, Jotai, Redux** — a general state container for one specific, small, well-understood
  shape. `useSyncExternalStore` is the primitive these are built on and it is in React already.
- **`useOptimistic` alone** — the framework default, and the honest first answer. It fails the one
  requirement that started this work: a failure the User navigates away from is a failure they never
  learn about.

## Costs accepted

- **We own it.** Ordering, persistence, cross-tab sync and eviction are our code and our bugs.
- **Server Components cannot subscribe to it.** A value that must change instantly in more than one
  place has to render through a client leaf that overlays the store's patch on the server's value.
  That list of fields is deliberate and written down, not incidental — `docs/features/data-access.md`.
