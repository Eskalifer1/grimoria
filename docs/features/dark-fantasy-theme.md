# Dark Fantasy Theme

## What it is

A user-selectable `Theme` (`CONTEXT.md`) that fully re-skins the product — visual styling and
every piece of UI copy — around the idea that the site _is_ a wizard's grimoire: each Note is a
spell recorded in it, and the User is a mage who can search their grimoire for any spell they
have bound to memory. It is the source of the project's name and a core v1 feature, not a
deferred one.

## Scope for v1

- Full visual re-styling when the Theme is active — palette, typography, imagery, iconography.
- Full copy re-mapping across the site: **every** UI string changes, not just headline nouns.
- The whole client app. `/admin/*` is deliberately excluded (ADR-0001); the Theme provider is
  scoped to the non-admin route group.

## Visual direction

Settled, and written in full in `design/dark-fantasy-design.md` — the place to look before
designing or implementing any dark-fantasy surface. Its load-bearing decisions:

- **Two material worlds** — dark atmospheric _Chrome_ and a light vellum _Page_ holding the
  Note body and nothing else. Every component is specified twice.
- **Red is ink, violet is light.** Red belongs to content and the Page and never glows; violet
  belongs to the Chrome and never prints. The same two-accent split `standard` uses, with the
  hues swapped, which is why one token contract serves both Themes.
- **Depth without 3D** — five receding planes, one light origin per screen, lit edges rather
  than uniform grey rules.
- **Runes as the signature motif**, never in place of readable text.

**The Note body font is not this Theme's to choose.** One reading serif — **Literata** — sets
the Note body under _both_ Themes, so switching Theme never changes what long-form reading
feels like. It is the single exception to "this Theme re-skins everything", and it exists for
the same reason the Page does. Everything else in the chrome remains this Theme's own.

Values live in `src/styles/dark-fantasy.css`, with the reasoning in
`design/dark-fantasy-tokens.md`.

**Token parity.** Both Themes fill one shared list of semantic names
(`design/token-contract.md`), so switching Theme swaps values, never which names exist. Where
this Theme has something `standard` does not — glow, blur, translucent surfaces — `standard`
fills those names with `none`, and where `standard` has drop shadows on cards, this Theme fills
`--shadow-card` with `none`. **A component must never branch on which Theme is active**; if it
has to, the contract is missing a name.

Structure — shells, the sidebar and its two modes, the absence of a global top bar — is shared
with `standard` and lives in `docs/features/site-layout.md`.

## How it's built

Copy is sourced through a `locale × theme` catalog (ADR-0004) rather than hardcoded strings, so
adding this Theme needs no one-off mechanism separate from localization. Each Theme is a full
message catalog — `messages/en/dark-fantasy.json` alongside `standard.json` — and the Theme
decides which one loads, so no component names a Theme.

**Storage.** Logged-in Users' choice persists on their User profile (syncing across devices);
Guests get a cookie, so the public notes page still respects their preference. It must be a
cookie rather than `localStorage` because the server resolves copy before rendering (ADR-0004).

**Styling.** Both Themes fill the whole token contract in `src/styles/`, and the active Theme
is a `data-theme` attribute on `<html>`, resolved on the server alongside the copy.
`standard`'s values sit on bare `:root`, so a surface the mechanism does not reach — `/admin`,
localized but not themed — still renders in a complete Theme. How code consumes these tokens is
`docs/agents/coding-standards/styling.md`.

**The operating system never selects this Theme.** A visitor whose system is in dark mode still
gets `standard`: `prefers-color-scheme` chooses nothing here, and `standard` has no dark
variant. This Theme is a different identity with different words, not a darker palette, and
handing someone the dark-fantasy tonality because of a system setting is the failure that rules
this out.

**Switching** has to reach the server and re-render, not just flip client state. Styling is CSS
custom properties and would repaint on its own, but the copy would stay in the old tonality — a
half-switched page is the failure mode to watch for. The control itself is #78; the mechanism
it drives landed with the token scaffold.

## Copy mapping

This table is the **vocabulary**. _How_ to write a string it does not cover — how far the
flavour goes, what errors and destructive warnings may become, what register to write in — is
`docs/agents/coding-standards/i18n.md`.

| Standard term | Dark fantasy term |
|---|---|
| Note | Spell |
| (a User's notes, collectively) | Grimoire |
| Public notes page | _(TBD — working name: "The Codex" or "Archive of Spells")_ |
| Create a note | Inscribe a spell |
| Search | Divination / Scrying _(TBD — pick one, keep consistent)_ |
| User / Profile | Mage |

**Intentionally incomplete** — seeded from the initial planning conversation, not a finished
spec. Expand it as each UI surface actually gets built, so the mapping stays grounded in real
screens rather than invented ahead of time. **A term invented while writing copy is added here
in the same change**, or the next string invents a second word for the same thing.

Strings appearing inside design mockups are **not** entries in this table. Mockups are composed
against sample copy so the type can be judged; nothing is added here until it is actually
chosen.

## Open questions

- Exact copy for the public listing page, search/filter UI labels, and
  admin-adjacent-but-visible strings such as error messages.
- Whether achievements, notifications and other future features get their own flavour terms now
  or when those features are built.
