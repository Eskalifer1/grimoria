# Dark Fantasy Theme

## What it is

A user-selectable `Theme` (see `CONTEXT.md`) that fully re-skins the product — both visual styling and every piece of UI copy — around the idea that the site *is* a wizard's grimoire: each Note is a spell recorded in it, and the user is a mage who can, at any time, search their grimoire to find any spell they've bound to memory. It's the source of the project's name and its core identity feature for v1 (see ADR — dark fantasy is core, not deferred).

## Scope for v1

- Full visual re-styling when the theme is active (palette, typography, imagery/iconography — actual design work tracked under the `area:design` epic).
- Full copy re-mapping across the site — every UI string changes, not just headline nouns.
- Applies to the whole client app. Admin (`/admin/*`) is deliberately excluded — see ADR-0001; the theme provider is scoped to the non-admin route group.

## Visual direction

Settled. The full written description lives in `design/dark-fantasy-design.md` — that file
is the input to building the design system, and the place to look before designing or
implementing any dark-fantasy surface. Its load-bearing decisions:

- **Two material worlds.** Dark atmospheric *Chrome* (sidebar, lists, modals) and a
  light vellum *Page* that holds the Note body and nothing else. Every component is
  specified twice; a control on one is never the other recoloured. The Page exists so
  long-form reading is never compromised by theme decoration — a product requirement, not a
  preference.
- **Red is ink, violet is light.** Red belongs to content and the Page (drop caps,
  rubrication, tag outlines, destructive actions) and never glows. Violet belongs to the
  Chrome (active nav, focus, halos, emitting edges) and never prints. The field beneath both
  is a neutral warm-leaning near-black, not a violet-black — a violet field would make the
  accent vanish into its own backdrop. This is the same two-accent split `standard` uses
  (action accent vs. content accent, `design/token-contract.md`); only the hues swap sides,
  which is why one token contract serves both Themes.
- **Depth without 3D.** Atmospheric imagery bleeding behind mastheads and dissolving; five
  receding planes with no two adjacent ones sharing a brightness; one light origin per
  screen; borders that are lit gradients rather than uniform grey rules.
- **Runes as the signature motif** — carving that glows from within, used for per-Note
  sigils, dividers, empty states, and focus. Never in place of readable text.
- **The Note body font is not this theme's to choose.** One reading serif — **Literata** —
  sets the Note body under *both* Themes, so switching Theme never changes what long-form
  reading feels like. This theme may not override it for decoration. It is the single
  exception to the rule that dark-fantasy re-skins everything, and it exists for the same
  reason the Page does. Everything else in the chrome — display serif, interface sans,
  monospace — remains this theme's own.

Concrete values — palette, scales, component tokens — are deliberately *not* fixed here.
They live in `design/dark-fantasy-tokens.md` and are #54's to ratify. Literata is the
exception because it is a cross-theme constraint rather than a token of this theme: it is
settled in #53, which owns the Note content font for both Themes.

**Token parity.** Both Themes fill one shared list of semantic token names
(`design/token-contract.md`), so switching Theme swaps values, never which names exist. Where
this Theme has something `standard` does not — glow, blur, translucent surfaces — `standard`
fills those names with `none`, and where `standard` has drop shadows on cards, this Theme
fills `--shadow-card` with `none`. A component must never branch on which Theme is active;
if it has to, the contract is missing a name.

Structure — shells, the sidebar and its two modes, the absence of a global top bar — is not
this theme's either. It is shared with `standard` and documented in
`docs/features/site-layout.md`.

## How it's built

Copy is sourced through a `locale × theme` resource (see the copy-system ADR) rather than hardcoded strings, so adding this theme doesn't require a separate one-off mechanism from whatever localization eventually uses. Concretely, each theme is a full message catalog — `messages/en/dark-fantasy.json` alongside `messages/en/standard.json` — and the theme decides which one loads, so no component names a theme.

**Storage**: logged-in users' choice persists on their User profile (syncs across devices); guests get a cookie, so the public notes page still respects their preference. It has to be a cookie rather than `localStorage` because the server resolves copy before rendering — see the copy-system ADR.

**Styling**: both Themes fill the whole token contract in `src/styles/`, and the active Theme is a `data-theme` attribute on `<html>`, resolved on the server alongside the copy. `standard`'s values sit on bare `:root`, so a surface the mechanism does not reach — `/admin`, which is localized but not themed (ADR-0001) — still renders in a complete Theme. How code consumes these tokens is `docs/agents/coding-standards/styling.md`.

**The operating system never selects this Theme.** A visitor whose system is in dark mode still gets `standard`: `prefers-color-scheme` chooses nothing here, and `standard` has no dark variant. This Theme is a different identity with different words, not a darker palette, and handing someone the dark-fantasy tonality because of a system setting is the failure that rules this out.

**Switching**: the toggle has to reach the server and re-render, not just flip client state. Styling is CSS custom properties and would repaint on its own, but the copy would stay in the old tonality — so a half-switched page is the failure mode to watch for. The control itself is #78; the mechanism it drives landed with the token scaffold.

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

This table is the **vocabulary**. *How* to write a string it doesn't cover — how far the
flavor goes, what errors and destructive warnings are allowed to become, what register to
write in — is `docs/agents/coding-standards/i18n.md` §8. A term invented while writing copy
is added here in the same change, or the next string invents a second word for the same
thing.

Strings that appear inside design mockups are **not** entries in this table. Mockups are
composed against sample copy so the type can be judged; nothing is added here until it is
actually chosen.

## Open questions (not yet resolved)

- Exact copy for the public listing page, search/filter UI labels, and admin-adjacent-but-visible strings (e.g. error messages).
- Whether achievements, notifications, and other future features get their own flavor terms now or when those features are actually built.
