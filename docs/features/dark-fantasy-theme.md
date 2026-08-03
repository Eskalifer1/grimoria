# Dark Fantasy Theme

## What it is

A user-selectable `Theme` (see `CONTEXT.md`) that fully re-skins the product — both visual styling and every piece of UI copy — around the idea that the site *is* a wizard's grimoire: each Note is a spell recorded in it, and the user is a mage who can, at any time, search their grimoire to find any spell they've bound to memory. It's the source of the project's name and its core identity feature for v1 (see ADR — dark fantasy is core, not deferred).

## Scope for v1

- Full visual re-styling when the theme is active (palette, typography, imagery/iconography — actual design work tracked under the `area:design` epic).
- Full copy re-mapping across the site — every UI string changes, not just headline nouns.
- Applies to the whole client app. Admin (`/admin/*`) is deliberately excluded — see ADR-0001; the theme provider is scoped to the non-admin route group.

## How it's built

Copy is sourced through a `locale × theme` resource (see the copy-system ADR) rather than hardcoded strings, so adding this theme doesn't require a separate one-off mechanism from whatever localization eventually uses.

**Storage**: logged-in users' choice persists on their User profile (syncs across devices); guests get a client-side cookie/localStorage value so the public notes page still respects their preference.

## Copy mapping (draft — expand as UI surfaces get built)

| Standard term | Dark fantasy term |
|---|---|
| Note | Spell |
| (a user's notes, collectively) | Grimoire |
| Public notes page | *(TBD — working name: "The Codex" or "Archive of Spells")* |
| Create a note | Inscribe a spell |
| Search | Divination / Scrying *(TBD — pick one, keep consistent)* |
| User / Profile | Mage |

This table is intentionally incomplete — it's seeded from the initial planning conversation, not a finished spec. Expand it as each UI surface actually gets designed/built, so the mapping stays grounded in real screens rather than invented ahead of time.

## Open questions (not yet resolved)

- Exact copy for the public listing page, search/filter UI labels, and admin-adjacent-but-visible strings (e.g. error messages).
- Whether achievements, notifications, and other future features get their own flavor terms now or when those features are actually built.
