# Token contract

The semantic names **both** Themes fill, so switching Theme swaps values and never swaps which
names exist. This file names things and says what each means; it holds no values, which live
in `src/styles/standard.css` and `src/styles/dark-fantasy.css`, with the reasoning behind them
in `standard-tokens.md` and `dark-fantasy-tokens.md`.

## The rule

Every name below is defined in every Theme. Where a Theme has nothing for a name the value is
`none`, `0`, or the nearest neutral — **not** a missing declaration. `standard` has no glow, so
`--glow-accent-sm: none`; that is a value, and it is the honest one.

Two consequences, and both are the point:

- **A component never asks which Theme is active.** It reads `--surface-card` and gets the
  right material. Any `data-theme` condition inside a component is a bug against this contract.
- **A new token is added to both Themes in the same change, or not at all.** A name existing
  in one Theme is the drift this file prevents.

## Tiers — where a raw value is allowed

**A literal colour appears exactly once, in tier 1, and everything above refers back.**

**Tier 1 — primitives.** The ramps (`--teal-700`, `--void-veil`, `--vellum-ink`) and the
scalar scales. The _only_ place a hex, an `rgb()`, a pixel count or a font stack is written
literally. Primitives are theme-private: neither a component nor the other Theme names one.

**Tier 2 — semantic.** Every name in this document. Its value is a `var()` onto a primitive, a
`color-mix()` over one, or a composite built from those. It **never** contains a literal
colour; `none`, `transparent`, `0` and `1` are not colours and are written directly.

**Tier 3 — components.** Read tier 2 only. A component reaching for `--teal-700` or
`--void-veil` has bound itself to one Theme and will be wrong in the other.

**Alpha** is `color-mix(in srgb, var(--primitive) N%, transparent)`, never a hand-written
`rgba()` restating the primitive's channels. A copied `rgba(196,169,253,.35)` is not the
violet — it is a second violet that nothing links to the first, and it will not follow when the
first changes. `color-mix()` is already a hard requirement of Tailwind v4, so it costs no
browser support that has not been spent.

**How to check:** no tier-2 declaration may contain `#`, `rgb(` or `rgba(`.

## The two accents

Both Themes have exactly two accents with the same two roles. Only the hues differ.

| Role | What it does | `standard` | `dark-fantasy` |
|---|---|---|---|
| **Action** | brand, primary action, active state, focus | deep teal | violet — _the light_ |
| **Content** | emphasis inside what the User wrote | violet | red — _the ink_ |

The rule that red never glows and violet never prints in `dark-fantasy` is this table read in
that Theme's material: the action accent emits, the content accent is printed. `standard`
obeys the same split without the atmosphere, which is why one contract serves both.

**An accent never crosses roles.** A content accent that starts carrying a button, or an action
accent tinting a code block, breaks both Themes at once.

## Names

### Surfaces — the Chrome

```
--surface-page        the field everything sits on
--surface-card        cards and panels
--surface-sidebar     the sidebar's own surface
--surface-raised      drawer, popover, menu — anything floating
--surface-inset       wells, sunken areas, code tint outside a Note
--surface-selected    fill of the active navigation row
--surface-inverse     the surface that contrasts with the Theme's chrome
--text-on-inverse     text on that surface
```

`--surface-inverse` is what lets **either Theme put text on the opposite value** — near-black
in `standard`, the vellum sheet in `dark-fantasy`. Each Theme therefore has both a light-on-dark
and a dark-on-light pairing, which is the property this pair exists to guarantee rather than
leave to chance.

`--surface-card` and `--surface-raised` may be translucent, and in `dark-fantasy` they are —
but never the field, never the sidebar, never the reading sheet.

### The reading sheet — the Page

Where the Note body is set. In `dark-fantasy` a light vellum sheet on the dark field; in
`standard` the same material as the chrome. **The tokens exist either way**, and components
rendering Note content read only these.

```
--page-surface        the sheet itself
--page-text           Note body text
--page-text-muted     secondary text inside a Note
--page-rule           hairline inside the Note body
--page-code-surface   code block background inside a Note
--page-accent         content accent as it prints on the sheet
```

### Text, borders, status — the Chrome

```
--text-title    --text-brand      action accent as text
--text-body     --text-accent     content accent as text
--text-muted    --text-on-brand   text on a filled action
--text-meta

--border-subtle   --border-brand
--border-strong   --border-disabled

--status-live   --status-idle   --status-done
```

### Interactive states

```
--action-primary-bg            --action-quiet-bg
--action-primary-bg-hover      --action-quiet-bg-hover
--action-primary-bg-pressed    --action-quiet-fg
--action-primary-fg            --action-quiet-fg-disabled
--action-primary-bg-disabled
--action-primary-fg-disabled
--focus-ring                   a full box-shadow value, not a colour
```

`--focus-ring` is a shadow rather than a colour because `dark-fantasy` focuses with a bloom and
`standard` with a flat ring. Same name, same slot, different value.

**Disabled is always a colour pair, never an `opacity` rule** — `standard-tokens.md` says why.

### Elevation, light, translucency

`standard` lifts with shadow and has no glow; `dark-fantasy` lifts with light and mostly has no
shadow. Both fill all of these.

```
--shadow-card    --glow-accent-sm
--shadow-raised  --glow-accent-md
--shadow-modal   --glow-text

--scrim-modal   --blur-card   --blur-raised   --blur-modal
```

`--blur-card` and `--blur-raised` are backdrop blurs on translucent surfaces; `--blur-modal` is
the blur applied to what sits _behind_ a dialog. A dialog's own body is never translucent in
either Theme — a decision should not have the page reading through it.

### Typography

```
--font-display   names of things: page and Note titles, section headings
--font-ui        functional chrome: buttons, labels, inputs, navigation
--font-reading   the Note body — the same family in both Themes
--font-meta      dates, counts, tags, section labels
--font-code      code, inside a Note and out
```

`--font-reading` and `--font-code` are **the same values in both Themes**, the only tokens for
which that is true by rule rather than coincidence. Both live inside the Note body, which is
content the User wrote; changing Theme must not change what their own writing looks like to
read.

`--font-display` and `--font-ui` may resolve to the same family — `standard` does exactly that,
separating display from interface by weight and size. Two names still exist, because
`dark-fantasy` needs two faces. `--font-meta` is a monospace in `standard` and a letterspaced
grotesque in `dark-fantasy`, which is why metadata and code are two roles rather than one
shared monospace token.

### Radii and motion

`standard` is round where `dark-fantasy` is cut — one of the sharpest differences between the
two, carried entirely by these five radii.

```
--radius-xs  --radius-sm  --radius-md  --radius-lg  --radius-pill

--dur-fast  --dur  --dur-slow  --ease-standard  --ease-emphasized  --press-scale
```

`--press-scale` is `dark-fantasy`'s clearest `none`-style value: that Theme shrinks nothing on
press, so it fills the token with `1` and answers a press by taking light away instead.

### Spacing — one scale, no token

**Every gap, pad and margin in the product is a multiple of 4px**, and this is the one group
whose _values_ are identical in both Themes rather than just its names — which is why it is
named here and in neither value document.

Rhythm is structural, not thematic: a Theme changes what a surface is made of, never how far
apart two things sit. The Themes still feel different in density because they draw from
different parts of the same scale — `standard` reaches for the wide end, `dark-fantasy` is
generous vertically and tight horizontally — but neither invents a value the other lacks.

**There is no spacing token, and none is to be added.** Tailwind's spacing utilities already
_are_ this scale (`p-6` is 24px), so a `--space-6` would be a second copy of a value the
framework holds, and a second copy is a second thing to drift.

Anything not a multiple of four is a hairline, a font metric, or a bug.
