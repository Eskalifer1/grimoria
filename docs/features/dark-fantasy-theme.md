# Dark Fantasy Theme

A user-selectable `Theme` (`CONTEXT.md`) that fully re-skins the product — visual styling and
every piece of UI copy — around the idea that the site _is_ a wizard's grimoire: each Note is a
spell recorded in it, and the User is a mage who can search their grimoire for any spell they
have bound to memory. Core to v1, not deferred.

## Scope for v1

- Full visual re-styling: palette, typography, imagery, iconography.
- Full copy re-mapping: **every** UI string changes, not just headline nouns.
- The whole client app — every surface under `src/app/(frontend)/`. Payload's admin at `/cms`
  is untouched by it: a separate route group with its own root layout and its own styles.

The look is settled in `design/dark-fantasy-design.md` — read it before designing or
implementing any dark-fantasy surface. Values are `src/styles/dark-fantasy.css`, reasoning is
`design/dark-fantasy-tokens.md`. Structure is shared with `standard` and lives in
`docs/features/site-layout.md`.

## The one thing this Theme does not re-skin

**The Note body font is not this Theme's to choose** — the single exception to "re-skins
everything", for the same reason the vellum Page exists. The constraint itself is
`design/token-contract.md`.

## How it's built

Copy comes from a `locale × theme` catalog and the choice is stored per User, in a cookie for
Guests (ADR-0004). Both Themes fill the whole token contract in `src/styles/`, and the active
Theme is a `data-theme` attribute on `<html>`, resolved on the server alongside the copy.

**The operating system never selects this Theme.** A visitor whose system is in dark mode still
gets `standard`: `prefers-color-scheme` chooses nothing here. This Theme is a different identity
with different words, not a darker palette.

**Switching must reach the server and re-render.** Flipping client state repaints the colors
through CSS custom properties and leaves the copy in the old tonality. The control is #78.

## Copy mapping

The **vocabulary**. _How_ to write a string it does not cover is
`docs/agents/coding-standards/i18n.md`.

| Standard term | Dark fantasy term |
|---|---|
| Note | Spell |
| (a User's notes, collectively) | Grimoire |
| Public notes page | _(TBD — "The Codex" or "Archive of Spells")_ |
| Create a note | Inscribe a spell |
| Search | Divination / Scrying _(TBD — pick one, keep consistent)_ |
| User / Profile | Mage |

**Intentionally incomplete** — expand it as each UI surface actually gets built, so the mapping
stays grounded in real screens. **A term invented while writing copy is added here in the same
change**, or the next string invents a second word for the same thing. Mockup strings are not
entries: nothing is added until it is actually chosen.

## Open questions

- Copy for the public listing page, search/filter labels, and admin-adjacent-but-visible
  strings such as error messages.
- Whether achievements, notifications and other future features get flavor terms now or when
  they are built.
