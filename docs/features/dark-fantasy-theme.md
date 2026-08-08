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

**The Note body font is not this Theme's to choose.** It is the single exception to "this Theme
re-skins everything", and it exists for the same reason the vellum Page does — everything else
in the chrome remains this Theme's own. What the constraint actually is, and the token parity
that makes switching Themes a swap of values rather than of names, is
`design/token-contract.md`.

## How it's built

Copy comes from a `locale × theme` catalog (ADR-0004): each Theme is a full message catalog,
and the Theme decides which one loads, so no component names a Theme. Both Themes fill the
whole token contract in `src/styles/`, and the active Theme is a `data-theme` attribute on
`<html>`, resolved on the server alongside the copy.

**Storage.** Logged-in Users' choice persists on their profile; Guests get a cookie, so the
public notes page respects their preference. It must be a cookie rather than `localStorage`
because the server resolves copy before rendering.

**The operating system never selects this Theme.** A visitor whose system is in dark mode still
gets `standard`: `prefers-color-scheme` chooses nothing here, and `standard` has no dark
variant. This Theme is a different identity with different words, not a darker palette, and
handing someone the dark-fantasy tonality because of a system setting is the failure that rules
this out.

**Switching must reach the server and re-render**, not just flip client state. CSS custom
properties would repaint on their own, but the copy would stay in the old tonality — a
half-switched page is the failure mode to watch for. The control is #78.

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
