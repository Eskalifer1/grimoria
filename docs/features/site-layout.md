# Site layout

The shell every page renders inside. **Theme-agnostic** — the structure is identical under both
Themes, and only the material differs (`design/standard-design.md`,
`design/dark-fantasy-design.md`, and `design/logo.md` for the mark those zones carry).

**The full structure is settled in the Site layout epic (#73), whose first comment is canonical**
— including the navigation items, which are still moving as their features land. Only what
constrains implementation is repeated here.

## Shells

- **App shell** — every authenticated surface. There is no admin group in it: the only admin is
  Payload's own at `/cms` (ADR-0005), which is outside the shell entirely and reached directly.
- **Public shell** — Guest surfaces: the public Note page and, later, Home/About.
- **Auth pages** — no shell at all; a centered, standalone layout.

## One Sidebar, two modes

A single `Sidebar` component, not two that look alike.

- **Persistent** — desktop, authenticated User. Always visible beside the content.
- **Drawer** — opened by a burger, overlaying the content. Mobile always, and Guests always,
  **at any viewport width**. In drawer mode a thin bar carries the burger and the brand mark;
  without it there is nothing to open the drawer from.

The persistent sidebar collapses to an **icon rail**. **Width never overrides the User's
collapse choice** — the rail is a decision, not a breakpoint.

**Collapse state is a server-resolved preference** — on the User profile when authenticated, in a
cookie for Guests, same rule as `Theme` and for the same reason (ADR-0004); otherwise the sidebar
jumps on every load. **Anything else that becomes a persisted UI preference inherits this rule.**

## Boundary surfaces

**Every "nothing here" surface is one `EmptyState`** (`shared/components/EmptyState/`) — an
illustration slot, a title at the heading level the caller names, a description, an action and a
reference line. A route boundary centers it in `FullPageView` with `heading="h1"`; an empty list
drops it into its card at `h2`. `not-found.tsx`, `unauthorized.tsx` and `forbidden.tsx` under
`[locale]` re-export a screen module from `views/`; `error.tsx` holds its own `"use client"`
implementation. `EmptyTitle` takes `asChild` so the heading element is the caller's.

**The error boundary never renders `error.message`** — Next strips it in production, so showing it
would make dev and prod two different screens, and a Payload or Postgres throw would leak schema
detail. `error.digest` renders as a quiet reference line instead.

**`src/app/global-error.tsx` and `src/app/global-not-found.tsx` replace `<html>`**, so they carry
no next-intl, no Theme and no shell: hardcoded English, a reload or a way home. Both draw on bare
`:root`, which is `standard`, so they carry `STANDARD_FONT_VARIABLES` from
`src/shared/config/fonts.ts` and are styled rather than raw. The second is reached only by a path
the proxy never rewrote — one with a dot in it (ADR-0016).

**The `illustration` slot is empty on every boundary today.** The artwork — one familiar with a
per-surface detail, keyed by `BOUNDARY_SURFACE` in `src/constants/boundary.ts` — lands in its own
issue.

**These surfaces render client-side only** — the initial HTML is empty. ADR-0016 has the upstream
issue and what was rejected.

## Content area

- **No global top bar.** A persistent bar above the page would duplicate the page masthead and
  cost vertical space in a product that is mostly reading and scanning.
- **Masthead**: page title plus a monospace count/status line, nothing else in v1. The slot
  opposite the title is reserved and deliberately empty, so adding one control later does not
  re-balance the page.
- **No search and no filters anywhere** — deferred to #4. A ⌘K palette stays compatible because
  it needs no chrome, but is not promised.
- The Notes list is a **masonry grid of cards**; what a card is made of is settled with the
  Notes list page design (#74).

The reference images in `design/` are working files and are **not canonical for structure** —
they show a global top bar, search field, filter and view-toggle controls, and a promotional
panel at the sidebar foot, none of which exist. Read them for material only.
