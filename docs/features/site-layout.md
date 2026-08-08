# Site layout

The shell every page renders inside: which layouts exist, how the sidebar behaves, what the
content area may carry. It is **theme-agnostic** — the structure is identical under `standard`
and `dark-fantasy`, and only the material differs.

This document holds only the parts that constrain implementation and would be expensive to
discover late. **The full structure is settled in the Site layout epic (#73), whose first
comment is canonical** — including the exact navigation items, which are still moving as their
features land and are deliberately not copied here.

## Shells

Three cases, not two.

- **App shell** — every authenticated surface, `/admin/*` included. Admin is not a second
  interface: per ADR-0001 it is ordinary pages of the same app, gated by Role, appearing as an
  extra navigation group in the same sidebar.
- **Public shell** — Guest surfaces: the public Note page and, later, Home/About.
- **Auth pages** — no shell at all; a centred, standalone layout.

## One Sidebar, two modes

There is a single `Sidebar` component. It is not two components that look alike.

- **Persistent** — desktop, authenticated User. Always visible beside the content.
- **Drawer** — opened by a burger, overlaying the content. Used on mobile always, and for
  Guests always, **at any viewport width**. In drawer mode a thin bar carries the burger and
  the brand mark; without it there is nothing to open the drawer from.

The persistent sidebar collapses to an **icon rail** — icons only, no labels. **Width never
overrides the User's collapse choice**: the rail is a decision, not a breakpoint.

**Collapse state is a server-resolved preference.** It persists on the User profile when
authenticated and in a cookie for Guests, and is read on the server so the first rendered frame
is already correct. Same rule as `Theme`, for the same reason (ADR-0004): the server builds the
markup and must know the state before the first frame, or the sidebar jumps on every load.
`localStorage` cannot work — the server never sees it. **Anything else that becomes a persisted
UI preference inherits this rule.**

## Content area

- **No global top bar.** The app shell is sidebar plus content. A persistent bar above the page
  would duplicate the page masthead and cost vertical space in a product that is mostly reading
  and scanning.
- **Masthead**: page title plus a monospace count/status line. Nothing else in v1. The slot
  opposite the title is reserved and deliberately left empty, so adding one control later does
  not re-balance the page.
- **No search and no filters anywhere** — deferred to #4. A ⌘K command palette stays compatible
  with this structure because it needs no chrome, but is not promised.
- The Notes list renders as a **masonry grid of cards**. What a card is made of is settled with
  the Notes list page design (#74), not here.

## Where the visual side lives

Structure is here; how these zones are made of each Theme's material is in
`design/standard-design.md` and `design/dark-fantasy-design.md`, and the mark those zones carry
is `design/logo.md`. Those documents fix no values and defer to this one for structure.

The reference images in `design/` are working files and are **not canonical for structure** —
they show a global top bar, a global search field, filter and view-toggle controls, and a
promotional panel at the sidebar foot, none of which exist. Read them for material only.
