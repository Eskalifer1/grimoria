# `app/` — the routing shell

How routes are organized, and which files under `app/` may hold implementation. Which layer code
belongs to is `layers.md`; names are `naming.md`.

`app/` splits into two route groups and every route belongs to one: `(frontend)/` is ours,
`(payload)/` is Payload's. Each has its own root layout, which is what makes the split real — the
themed, localized layout never wraps the admin, and Payload's CSS never reaches the product. Groups
do not appear in URLs. `app/` itself cannot move: Next.js resolves it at `app/` or `src/app/` only.
**`favicon.ico` is honored only at the root of `app/`** — inside a group it is ignored silently,
surfacing as one fewer route in the build table.

Structure inside `app/` is routing structure, never code organization. A `page.tsx` renders exactly
one screen module as a default re-export with no wrapper
(`export { NotesListPage as default } from '@/views/NotesListPage';`), and route `metadata` and
segment config live alongside it. Three categories of file:

- **Re-export from `views/`** — `page.tsx`, `layout.tsx`, `not-found.tsx`.
- **May hold implementation**, because Next.js executes them by filename — `error.tsx` and
  `global-error.tsx` (carrying `"use client"` in that exact file), `loading.tsx`, `route.ts`, and
  the metadata conventions (`opengraph-image.tsx`, `icon.tsx`, `sitemap.ts`, `robots.ts`, …).
  **Open list**: a new Next.js convention joins it by explicit decision, which is not a license to
  put arbitrary implementation in `app/`.
- **Vendored** — the `(payload)` route group. None of these conventions apply.

`(payload)` mounts `/cms` (Payload's admin, the only admin there is — ADR-0005), `/api/*` (REST, on
a catch-all) and `/api/graphql`. **`/api/*` belongs to Payload** — a vendor default, not an
architectural rule, so it says nothing about how our mutations are written (open in #49/#61). Our
own handler under `/api` would collide with that catch-all; the escape hatch is
`routes.api: '/api/payload'`.

`src/app/(payload)/**` and `src/payload-types.ts` are generated: Biome and cspell skip both, and
both are committed — `payload-types.ts` feeds every layer's domain types, so generating it at build
time would break `tsc` on a clean clone. Regenerate with `yarn generate:types` and
`yarn generate:importmap`.
