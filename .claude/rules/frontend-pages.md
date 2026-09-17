---
paths:
  - "src/app/(frontend)/**"
---

# Adding or editing a page here

**A page's title, description, social card and `theme-color` are set the way
`docs/features/metadata.md` says** — a new page under `(frontend)` reads it first.

**A new page is one entry in `FRONTEND_ROUTES` (`src/constants/routes.ts`) — `tsc` and
`tests/app/pageRoutes.test.ts` then name every other table owed a row**: who may read it
(`ROUTE_AUDIENCES`), and for an `ANYONE` route the `/llms.txt` section
(`docs/features/machine-readable.md`).
