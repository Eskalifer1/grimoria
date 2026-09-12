# Token contract

The semantic names **both** Themes fill, so switching Theme swaps values and never swaps which
names exist. The full name list is `src/styles/standard.css` — the two Theme files are each
other's checklist. This document holds the rules governing them, and the meanings a name does
not carry on its own.

## Contents

- The rules
- The `--mascot-*` group
- Tiers — where a raw value is allowed
- The two accents
- What the names do not say
- Spacing and type size — two fluid scales, one exception

## The rules

**Every name is defined in every Theme.** Where a Theme has nothing for one, the value is
`none`, `0`, or the nearest neutral — not a missing declaration. `standard` has no glow, so
`--glow-accent-sm: none`.

**A component never asks which Theme is active.** Any `data-theme` condition inside a component
is a bug against this contract.

**A new token is added to both Themes in the same change, or not at all.**

**Motion is muted for both Themes at once.** `prefers-reduced-motion: reduce` collapses the
`--dur-*` values in `globals.css`, so every transition timed by them shortens with them. Motion
timed any other way escapes that switch and leaves the preference unhonored.

**A utility naming no timing still moves on the Theme's.** `--default-transition-duration` and
`--default-transition-timing-function` in `tokens.css` alias `--dur` and `--ease-standard`, and
`globals.css` sets `--tw-animation-duration` and `--tw-ease` for the registry animations that read
neither.

**A loop is stopped, not shortened.** `--dur-loop` and `--ease-loop` time every repeating
animation, and the same block switches each off by name. What the loop decorated has to still
read without it: `SyncProgressBar` says "a write is out" by being on screen, the mascot skeleton
holds the drawing's place, and the sweep or the shimmer is only the movement on top.

## The `--mascot-*` group

**Tier 1, and the one primitive group a component-level stylesheet reads directly.** Each name is
a class in the mascot SVGs, filled by `src/styles/mascot.css`; the values are the hexes as drawn,
not aliases into the palette.
`--mascot-detail` is a `display` value — `none` in `standard` — and a `prop-*` name carries the
same value in both Themes. Adding a class means adding its token to both files, `design/mascot.md`.

## Tiers — where a raw value is allowed

**A literal color appears exactly once, in tier 1, and everything above refers back.**

1. **Primitives** — the ramps (`--teal-700`, `--void-veil`) and scalar scales. The only place a
   hex, `rgb()`, pixel count or font stack is written literally. Theme-private: neither a
   component nor the other Theme names one.
2. **Semantic** — a `var()` onto a primitive, a `color-mix()` over one, or a composite built
   from those. **Never a literal color**; `none`, `transparent`, `0` and `1` are not colors.
3. **Components** — read tier 2 only.

**Alpha is `color-mix(in srgb, var(--primitive) N%, transparent)`**, never a hand-written
`rgba()` restating the primitive's channels.

**The check:** no tier-2 declaration contains `#`, `rgb(` or `rgba(`.

## The two accents

Both Themes have exactly two accents with the same two roles. Only the hues differ.

| Role | What it does | `standard` | `dark-fantasy` |
|---|---|---|---|
| **Action** | brand, primary action, active state, focus | deep teal | violet — _the light_ |
| **Content** | emphasis inside what the User wrote | violet | red — _the ink_ |

**An accent never crosses roles.**

## What the names do not say

These carry a decision:

- **`--surface-inverse` / `--text-on-inverse`** let **either Theme put text on the opposite
  value** — near-black in `standard`, the vellum sheet in `dark-fantasy`.
- **The `--page-*` family is the reading sheet**, where the Note body is set. In `dark-fantasy`
  a light vellum sheet on the dark field; in `standard` the same material as the chrome. **The
  tokens exist either way**, and components rendering Note content read only these.
- **`--surface-card` and `--surface-raised` may be translucent**, and in `dark-fantasy` they
  are. Never the field, never the sidebar, never the reading sheet.
- **`--focus-ring` is a full box-shadow, not a color**, because `dark-fantasy` focuses with a
  bloom and `standard` with a flat ring.
- **`--blur-modal` blurs what sits _behind_ a dialog**, where `--blur-card` and `--blur-raised`
  are backdrop blurs on translucent surfaces. A dialog's own body is never translucent.
- **Disabled is always a color pair, never an `opacity` rule** — `standard-tokens.md` says why.
- **`--status-failed` is the fourth status, and the only status either Theme may spend a red on.**
  It says what a thing _is_, so it never doubles as the fill of a control that acts.
- **A toast says which kind it is with `--status-*` on its edge and icon, never as a fill.**
- **`--action-destructive-*` is the third action family**, six names mirroring
  `--action-primary-*`. **Both Themes fill it with a dark red under light ink** — the one place
  `dark-fantasy` does not answer with light. A Theme may spend one red on both this and
  `--status-failed`.
- **`--font-code` holds the same value in both Themes**, the only token for which that is true by
  rule: code inside a Note is content the User wrote, and changing Theme must not change what
  their own code looks like to read. **`--font-reading` takes each Theme's own text face**. **Neither
  Theme may set a display face on the reading token**, and the Note body is set at `max-w-prose`
  under both (`<standards>/responsive.md`). Which families fill them, and at which weights, is each
  Theme's token document.
- **`--font-display` and `--font-ui` may resolve to one family** — `standard` does exactly that,
  separating them by weight and size. Two names exist because `dark-fantasy` needs two faces.
  **`--font-meta` is a monospace in `standard` and a letterspaced grotesque in `dark-fantasy`**,
  which is why metadata and code are two roles rather than one shared monospace token.

## Spacing and type size — two fluid scales, one exception

**Type step names are Tailwind's own** (`text-xs` … `text-9xl`); the *values* are fluid, in
`src/styles/tokens.css`, shared by both Themes. Line height stays
Tailwind's own ratio, riding on the fluid size. The reading sheet's looser measure is
`leading-relaxed` on the one component that renders Note body.

**The space palette (`--spacing-3xs` … `--spacing-3xl`, plus the pairs `sm-lg`, `md-lg`, `lg-xl`, `xl-2xl`) is the named
exception to "no spacing token"** — also fluid, also in `tokens.css`. Which of the two scales a
given case takes is `<standards>/responsive.md`.

**Letter spacing is the exception, and stays a token**, because it follows the type family and
the Themes do not share one: `standard` tightens a grotesque as it grows, `dark-fantasy` sets
Playfair Display at its drawn width. Five names — `--ls-display`, `--ls-title`, `--ls-body`,
`--ls-meta`, `--ls-mono`. The first three reach components as the modifier paired to a `text-*`
step, so a size cannot be written without its tracking; the last two follow a font role rather
than a size and are `tracking-meta` and `tracking-mono`. Tailwind's own tracking scale is dropped
in `tokens.css`, so a fixed value cannot outrank a Theme.
