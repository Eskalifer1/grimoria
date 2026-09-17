# Caching is decided per read, not per page

`cacheComponents: true` (`next.config.ts`) makes every read state its own caching, rather than a
page-level `revalidate`. Next 16.2 implies `experimental.rootParams` from it.

**A read's directive follows who the answer depends on**, not which page shows it:

- **Identical for every caller** — `'use cache'` + `cacheTag(...)` + `cacheLife('days')`, the
  default. This is what a page's shell can hold, and Next prerenders it.
- **Identical, but inside a live `Suspense` hole** — `'use cache: remote'`. It is never
  prerendered, only cached at runtime in the durable store shared across instances, which is
  what lets a cold serverless instance still hit the cache.
- **Depends on the caller** — `'use cache: private'` + `cacheLife('hours')`. Request-scoped on
  the server, held in the browser's own router cache for `stale`, and never written to a shared
  store — a Guest can never read another User's cached answer, and it needs no custom cache
  handler.

**Tags name the record and the collection, not the feature that reads them** —
`collectionTag('users')` is `'users'`, `recordTag('users', id)` is `'user:42'`
(`src/constants/cacheTags.ts`). A mutation of one record invalidates both; a screen's data outlives
the screen, and a tag scoped to the screen would leave a second reader of the same record stale.

Rejected: feature-named tags (`profile/name`).

Rejected: keeping `revalidatePath`/`ROUTE_PATTERNS` for writes. A tag names what changed; a path
matched the wrong thing the moment #95 folded `[theme]/[locale]` into a `cacheComponents` root, and
every write already knows which record and collection it touched.

## Costs accepted

- **A read that must vary per caller cannot be prerendered.** `'use cache: private'` trades a
  static shell for correctness — the alternative is a shared cache serving one User's data to
  another.
- **A view owns its own `Suspense` boundary.** One `loading.tsx` per segment was rejected: it hides
  the whole shell behind the slowest hole instead of showing what already resolved.
