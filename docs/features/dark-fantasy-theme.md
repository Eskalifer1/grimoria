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

Copy comes from a `locale × theme` catalog, the choice is stored per User and carried in a cookie
for everyone (ADR-0004), and the cookie is what the proxy turns into a hidden route segment so both
Themes are prerendered (ADR-0015). Both Themes fill the whole token contract in `src/styles/`, and
the active Theme is a `data-theme` attribute on `<html>`, resolved on the server alongside the copy.

**The operating system never selects this Theme.** A visitor whose system is in dark mode still
gets `standard`: `prefers-color-scheme` chooses nothing here. This Theme is a different identity
with different words, not a darker palette.

**Switching must reach the server and re-render.** Flipping client state repaints the colors
through CSS custom properties and leaves the copy in the old tonality. The control is #78.

## Copy mapping

The **vocabulary**. Catalog mechanics — keys, namespaces, where a string is read — are
`docs/agents/coding-standards/i18n.md`.

| Standard term | Dark fantasy term |
|---|---|
| Note | Spell |
| (a User's notes, collectively) | Grimoire |
| Create a note | Inscribe a spell |
| User / Profile | Mage |
| Save | Bind |
| Dismiss | Banish |

**A term invented while writing copy is added here in the same change**, or the next string invents
a second word for the same thing. **A term not yet chosen is not a row** — the table holds what is
settled, and #7 is canonical for what is still open.

## Writing a string the table does not cover

**Flavor the lexicon, keep the sentence.** Take the theme's verbs and nouns (bind, inscribe,
spell, grimoire, sigil); keep the structure, register and roughly the length of the standard
string, which renders in the same layout.

| Standard | Dark fantasy |
| --- | --- |
| Create a note | Inscribe a spell |
| You haven't written anything down yet. | No spells are bound to your grimoire yet. |
| Saving failed. Try again. | The binding failed. Try again. |
| Deleted permanently. This can't be undone. | Unbound forever. It cannot be recalled. |

1. **Meaning is untouchable.** Nothing added, nothing lost.
2. **Use the table.** A mapped term is used as mapped, never as a synonym — a note is a
   _spell_, not a _scroll_.
3. **Keep the shape.** Same structure, same number of sentences, length within ~±20%.
4. **Solemn, not archaic.** No `thee`, `thou`, `hath`, no `Alas`. Serious, not costume.
5. **Errors are flavored; the consequence stays literal.** ✓ "Unbound forever. It cannot be
   recalled." ✗ "The spell returns to the void." — nothing there says the data is gone.
6. **Data is never flavored** — numbers, dates, user names, note titles, file names.
7. **A new term goes in the table above**, same change, or the next string invents a second word
   for the same thing.
