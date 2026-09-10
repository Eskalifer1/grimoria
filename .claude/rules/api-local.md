---
paths:
  - "src/api/**"
---

# Writing server code here

**Read `docs/features/data-access/api-local.md` before writing an action or a read here.** It is
canonical: it holds the folder layout, the wrapper options, the failure codes and the read rules.
This file is a reminder, not a substitute.

Four things nothing warns you about:

- **One exported action per `"use server"` file, and nothing else.** Every export is a public
  endpoint reachable with arbitrary arguments, and the loader leaves a broken reference behind for
  an export that is not an async function. The schema goes in `contract.ts` beside `index.ts`.
- **A write passes `overrideAccess: false` and the session `user`.** Without both, Payload's own
  collection access never runs and `authorize` is the only thing standing there.
- **`revalidatePaths` takes `ROUTE_PATTERNS`, never `ROUTES`.** Every page sits under
  `[theme]/[locale]`, so `/profile` matches no declared route: the call answers success and the screen keeps its stale
  data.
- **A refusal throws an `ActionError` carrying a code** (`notFoundError()`, `forbiddenError()`),
  which the wrapper turns into the failure member. A bare `throw` crosses the client boundary as a
  rejected promise instead.
