# Token contract

The semantic names **both** Themes fill, so switching Theme swaps values and never swaps which
names exist. The full name list is `src/styles/standard.css` — the two Theme files are each
other's checklist. This document holds the rules governing them, and the meanings a name does
not carry on its own.

## Contents

- The rules
- Tiers — where a raw value is allowed
- The two accents
- What the names do not say
- Spacing and type size — one scale, no token

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

**A utility naming no timing still moves on the Theme's.** `--default-transition-duration` and
`--default-transition-timing-function` in `tokens.css` alias `--dur` and `--ease-standard`, and
`globals.css` sets `--tw-animation-duration` and `--tw-ease` for the registry animations that read
neither.

**A loop is stopped, not shortened.** `--dur-loop` and `--ease-loop` time the one repeating
animation there is, and the same block switches it off by name — collapsed like a transition it
would strobe, which is what the preference exists to prevent. What the loop decorated has to
still read without it: `SyncProgressBar` says "a write is out" by being on screen, and the sweep
is only the movement on top.

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
`rgba()` restating the primitive's channels.

**The check:** no tier-2 declaration contains `#`, `rgb(` or `rgba(`.

## The two accents

Both Themes have exactly two accents with the same two roles. Only the hues differ.

| Role | What it does | `standard` | `dark-fantasy` |
|---|---|---|---|
| **Action** | brand, primary action, active state, focus | deep teal | violet — _the light_ |
| **Content** | emphasis inside what the User wrote | violet | red — _the ink_ |

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
- **`--status-failed` is the fourth status, and the only status either Theme may spend a red on.**
  It says what a thing _is_, so it never doubles as the fill of a control that acts.
- **A toast says which kind it is with `--status-*` on its edge and icon, never as a fill.** A
  filled surface would owe both Themes a readable ink pair per type, and `dark-fantasy` spends no
  green: success there reads violet, failure blood-red.
- **`--action-destructive-*` is the third action family**, six names mirroring
  `--action-primary-*`. **Both Themes fill it with a dark red under light ink** — the one place
  `dark-fantasy` does not answer with light. A Theme may spend one red on both this and
  `--status-failed`.
- **`--font-code` holds the same value in both Themes**, the only token for which that is true by
  rule: code inside a Note is content the User wrote, and changing Theme must not change what
  their own code looks like to read. **`--font-reading` takes each Theme's own text face** — a
  fifth family bought a shared reading voice at one download nothing else used (#106). **Neither
  Theme may set a display face on the reading token**, and the Note body is set at a measure of
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

## Spacing and type size — one scale, no token

**Every gap, pad and margin is a multiple of 4px**, and this is the one group whose _values_ are
identical in both Themes rather than just its names, which is why it is named here and in
neither value document.

**There is no spacing token and none is to be added.** Tailwind's utilities already _are_ this
scale, so a `--space-6` would be a second copy of a value the framework holds. Anything not a
multiple of four is a hairline, a font metric, or a bug.

**Font size and line height are Tailwind's scale, by the same argument.** `text-*` is the type
scale — both Themes step through the same sizes. The reading sheet's looser measure is
`leading-relaxed` on the one component that renders Note body.

**Letter spacing is the exception, and stays a token**, because it follows the type family and
the Themes do not share one: `standard` tightens a grotesque as it grows, `dark-fantasy` sets
Playfair Display at its drawn width. Five names — `--ls-display`, `--ls-title`, `--ls-body`,
`--ls-meta`, `--ls-mono`. The first three reach components as the modifier paired to a `text-*`
step, so a size cannot be written without its tracking; the last two follow a font role rather
than a size and are `tracking-meta` and `tracking-mono`. Tailwind's own tracking scale is dropped
in `tokens.css`, so a fixed value cannot outrank a Theme.
