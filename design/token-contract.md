# Token contract

The semantic names **both** Themes fill, so switching Theme swaps values and never swaps which
names exist. The full name list is `src/styles/standard.css` — the two Theme files are each
other's checklist. This document holds the rules governing them, and the meanings a name does
not carry on its own.

## The rules

**Every name is defined in every Theme.** Where a Theme has nothing for one, the value is
`none`, `0`, or the nearest neutral — not a missing declaration. `standard` has no glow, so
`--glow-accent-sm: none`; that is a value, and it is the honest one.

**A component never asks which Theme is active.** Any `data-theme` condition inside a component
is a bug against this contract.

**A new token is added to both Themes in the same change, or not at all.** A name existing in
one Theme is the drift this file prevents.

**Motion is muted for both Themes at once.** `prefers-reduced-motion: reduce` collapses the
`--dur-*` values in `globals.css`, so every transition timed by them shortens with them. Motion
timed any other way escapes that switch and leaves the preference unhonored.

## Tiers — where a raw value is allowed

**A literal color appears exactly once, in tier 1, and everything above refers back.**

1. **Primitives** — the ramps (`--teal-700`, `--void-veil`) and scalar scales. The only place a
   hex, `rgb()`, pixel count or font stack is written literally. Theme-private: neither a
   component nor the other Theme names one.
2. **Semantic** — a `var()` onto a primitive, a `color-mix()` over one, or a composite built
   from those. **Never a literal color**; `none`, `transparent`, `0` and `1` are not colors.
3. **Components** — read tier 2 only. A component reaching for `--teal-700` has bound itself to
   one Theme and will be wrong in the other.

**Alpha is `color-mix(in srgb, var(--primitive) N%, transparent)`**, never a hand-written
`rgba()` restating the primitive's channels — a copied `rgba(196,169,253,.35)` is a second
violet that nothing links to the first, and it will not follow when the first changes.

**The check:** no tier-2 declaration contains `#`, `rgb(` or `rgba(`.

## The two accents

Both Themes have exactly two accents with the same two roles. Only the hues differ.

| Role | What it does | `standard` | `dark-fantasy` |
|---|---|---|---|
| **Action** | brand, primary action, active state, focus | deep teal | violet — _the light_ |
| **Content** | emphasis inside what the User wrote | violet | red — _the ink_ |

"Red never glows, violet never prints" is this table read in `dark-fantasy`'s material: the
action accent emits, the content accent is printed. `standard` obeys the same split without the
atmosphere, which is why one contract serves both.

**An accent never crosses roles.** A content accent carrying a button, or an action accent
tinting a code block, breaks both Themes at once.

## What the names do not say

Most names mean what they say. These carry a decision:

- **`--surface-inverse` / `--text-on-inverse`** let **either Theme put text on the opposite
  value** — near-black in `standard`, the vellum sheet in `dark-fantasy`. Each Theme therefore
  has both a light-on-dark and a dark-on-light pairing, which is the property this pair
  guarantees rather than leaves to chance.
- **The `--page-*` family is the reading sheet**, where the Note body is set. In `dark-fantasy`
  a light vellum sheet on the dark field; in `standard` the same material as the chrome. **The
  tokens exist either way**, and components rendering Note content read only these — that is
  what lets one component sit on either without knowing it moved.
- **`--surface-card` and `--surface-raised` may be translucent**, and in `dark-fantasy` they
  are. Never the field, never the sidebar, never the reading sheet.
- **`--focus-ring` is a full box-shadow, not a color**, because `dark-fantasy` focuses with a
  bloom and `standard` with a flat ring.
- **`--blur-modal` blurs what sits _behind_ a dialog**, where `--blur-card` and `--blur-raised`
  are backdrop blurs on translucent surfaces. A dialog's own body is never translucent — a
  decision should not have the page reading through it.
- **Disabled is always a color pair, never an `opacity` rule** — `standard-tokens.md` says why.
- **`--font-reading` and `--font-code` hold the same values in both Themes**, the only tokens
  for which that is true by rule. Both live inside the Note body, which is content the User
  wrote; changing Theme must not change what their own writing looks like to read. **Neither
  Theme may override the reading face for decoration**, and the Note body is set at a measure of
  roughly 68–75 characters under both. Which families fill them, and at which weights, is each
  Theme's token document.
- **`--font-display` and `--font-ui` may resolve to one family** — `standard` does exactly that,
  separating them by weight and size. Two names exist because `dark-fantasy` needs two faces.
  **`--font-meta` is a monospace in `standard` and a letterspaced grotesque in `dark-fantasy`**,
  which is why metadata and code are two roles rather than one shared monospace token.
- **`--press-scale`** is the clearest `none`-style value: `dark-fantasy` shrinks nothing, fills
  it with `1`, and answers a press by taking light away.
- **The five radii** carry one of the sharpest differences between the Themes: `standard` is
  round where `dark-fantasy` is cut.

## Spacing — one scale, no token

**Every gap, pad and margin is a multiple of 4px**, and this is the one group whose _values_ are
identical in both Themes rather than just its names, which is why it is named here and in
neither value document.

Rhythm is structural, not thematic: a Theme changes what a surface is made of, never how far
apart two things sit. The Themes still feel different in density because they draw from
different parts of the same scale — `standard` reaches for the wide end, `dark-fantasy` is
generous vertically and tight horizontally — but neither invents a value the other lacks.

**There is no spacing token and none is to be added.** Tailwind's utilities already _are_ this
scale, so a `--space-6` would be a second copy of a value the framework holds. Anything not a
multiple of four is a hairline, a font metric, or a bug.
