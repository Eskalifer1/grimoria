# Site layout

The shell every page renders inside. **Theme-agnostic** — the structure is identical under both
Themes, and only the material differs (`design/standard-design.md`,
`design/dark-fantasy-design.md`, and `design/logo.md` for the mark those zones carry).

Only the parts that constrain implementation and would be expensive to discover late are here.
**The full structure is settled in the Site layout epic (#73), whose first comment is
canonical** — including the navigation items, which are still moving as their features land and
are deliberately not copied here.

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

**Collapse state is a server-resolved preference**: on the User profile when authenticated, in a
cookie for Guests, read on the server so the first rendered frame is already correct. Same rule
as `Theme`, for the same reason (ADR-0004) — the server builds the markup and must know the
state before the first frame, or the sidebar jumps on every load. **Anything else that becomes a
persisted UI preference inherits this rule.**

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
