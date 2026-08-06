# Token contract

The list of semantic token names **both** Themes fill. It exists so that switching Theme is
swapping values under one set of names, never swapping which names exist.

## The rule

Every name below is defined in every Theme. Where a Theme has nothing for a name, the value
is `none`, `0`, or the nearest neutral — **not** a missing declaration. `standard` has no
glow, so `--glow-accent-sm: none`; that is a value, and it is the honest one.

Two consequences, and both are the point:

- A component never asks which Theme is active. It reads `--surface-card` and gets the right
  material. Any `data-theme`-conditional inside a component is a bug against this contract.
- A new token is added to **both** value documents in the same change, or not at all. A name
  that exists in one Theme is the drift this file prevents.

Values live in `standard-tokens.md` and `dark-fantasy-tokens.md`. This file names things and
says what each one means; it holds no values.

---

## Layers — where a raw value is allowed

Tokens sit in three tiers, and the rule is one sentence: **a literal colour appears exactly
once, in tier 1, and everything above it refers back.**

**Tier 1 — primitives.** The ramps: `--teal-700`, `--void-veil`, `--vellum-ink`, and the
scalar scales for spacing, radii, and duration. This is the *only* place a hex, an `rgb()`,
a pixel count, or a font stack is written literally. Primitives are theme-private: a
component never names one, and neither does the other Theme.

**Tier 2 — semantic.** Every name in this document. A semantic token's value is a `var()`
onto a primitive, a `color-mix()` over one, or a composite (shadow, ring) built from those.
**It never contains a literal colour.** The keywords `none`, `transparent`, `0`, and `1` are
not colours and are written directly.

**Tier 3 — components.** Read tier 2 only. A component that reaches for `--teal-700` or
`--void-veil` has bound itself to one Theme and will be wrong in the other.

### Alpha

A translucent value is `color-mix(in srgb, var(--primitive) N%, transparent)` — never a
hand-written `rgba()` restating the primitive's channels. A copied `rgba(196,169,253,.35)`
is not the violet; it is a second violet that nothing links to the first, and it will not
follow when the first changes.

`color-mix()` is already a hard requirement of Tailwind v4, which this project uses, so it
costs no browser support that has not already been spent.

### How to check

No line in either value document may declare a token whose value contains `#`, `rgb(`, or
`rgba(` unless that line is inside a tier-1 ramp table. Everything else resolves through
`var()`.

---

## The two accents

Both Themes have exactly two accents, with the same two roles. Only the hues differ, and
each Theme's design document explains its own pairing.

| Role | What it does | `standard` | `dark-fantasy` |
|---|---|---|---|
| **Action** | brand, primary action, active state, focus | deep teal | violet — *the light* |
| **Content** | emphasis inside what the User wrote | violet | red — *the ink* |

The rule that red never glows and violet never prints in `dark-fantasy` is this table read in
that Theme's material: the action accent is what emits, the content accent is what is
printed. `standard` obeys the same split without the atmosphere — teal acts, violet is
content — which is why one contract serves both.

An accent never crosses roles. A content accent that starts carrying a button, or an action
accent that starts tinting a code block, breaks both Themes at once.

---

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

`--surface-inverse` is what lets **either Theme put text on the opposite value**. In
`standard`, whose chrome is light, it is near-black and carries tooltips and toasts. In
`dark-fantasy`, whose chrome is dark, it is the vellum sheet — the same light material the
Note body sits on. Each Theme therefore has both a light-on-dark and a dark-on-light pairing,
which is the property this pair exists to guarantee rather than leave to chance.

`--surface-card` and `--surface-raised` may be translucent. In `dark-fantasy` they are, and
that is the Theme's primary depth mechanism (`dark-fantasy-design.md` §4) — but never the
field, never the sidebar, and never the reading sheet, because §8 bars frosted glass as the
*default* surface. In `standard` both are opaque and the blur tokens below are `0`.

### The reading sheet — the Page

Where the Note body is set. In `dark-fantasy` this is a light vellum sheet lying on the dark
field, and it is the Theme's central structural idea. In `standard` the sheet and the chrome
are the same material, so these resolve to the ordinary white and ink — **the tokens still
exist**, and components that render Note content read only these.

```
--page-surface        the sheet itself
--page-text           Note body text
--page-text-muted     secondary text inside a Note
--page-rule           hairline inside the Note body
--page-code-surface   code block background inside a Note
--page-accent         content accent as it prints on the sheet
```

### Text — the Chrome

```
--text-title    --text-brand      action accent as text
--text-body     --text-accent     content accent as text
--text-muted    --text-on-brand   text on a filled action
--text-meta
```

### Borders

```
--border-subtle   --border-brand
--border-strong   --border-disabled
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

`--focus-ring` is a shadow rather than a colour because `dark-fantasy` focuses with a bloom
and `standard` with a flat ring. Same name, same slot, different value.

Disabled is always a colour pair, never an `opacity` rule — see `standard-tokens.md` §2 for
why.

### Status

```
--status-live   --status-idle   --status-done
```

### Elevation and light

`standard` lifts with shadow and has no glow. `dark-fantasy` lifts with light and mostly has
no shadow. Both fill all six.

```
--shadow-card    --glow-accent-sm
--shadow-raised  --glow-accent-md
--shadow-modal   --glow-text
```

### Translucency

```
--scrim-modal   --blur-card   --blur-raised   --blur-modal
```

`--blur-card` and `--blur-raised` are backdrop blurs on translucent surfaces; `--blur-modal`
is the blur applied to what sits *behind* a dialog. A dialog's own body is never translucent
in either Theme — a decision should not have the page reading through it.

### Typography

```
--font-display   names of things: wordmark, page and Note titles, section headings
--font-ui        functional chrome: buttons, labels, inputs, navigation
--font-reading   the Note body — the same family in both Themes
--font-meta      dates, counts, tags, section labels
--font-code      code, inside a Note and out
```

`--font-reading` and `--font-code` are **the same values in both Themes** and are the only
tokens for which that is true by rule rather than by coincidence. Both live inside the Note
body, which is content the User wrote; changing Theme must not change what their own writing
looks like to read. Everything else is the Theme's own.

`--font-display` and `--font-ui` may resolve to the same family — `standard` does exactly
that, separating display from interface by weight and size instead. Two names still exist,
because `dark-fantasy` needs them to be different faces.

`--font-meta` is a monospace in `standard` and a letterspaced grotesque in `dark-fantasy`.
That is why metadata and code are two roles rather than one shared monospace token.

### Spacing — one scale, identical in both Themes

**`--space-N` is always `N × 4px`.** Every gap, pad, and margin in the product is a multiple
of four, and the token's index is that multiple, so `--space-6` is unambiguously `24px`
without anyone having to look it up.

```
--space-0:  0px    --space-5: 20px    --space-10: 40px
--space-1:  4px    --space-6: 24px    --space-12: 48px
--space-2:  8px    --space-7: 28px    --space-16: 64px
--space-3: 12px    --space-8: 32px    --space-20: 80px
--space-4: 16px
```

Spacing is the one group whose **values are identical in both Themes**, not merely the names,
and it is therefore **declared once** — in `:root`, outside the per-Theme blocks, which never
redeclare it. That is why the scale appears here and not in either value document: a second
copy is a second thing to drift.
Rhythm is structural, not thematic: a Theme changes what a surface is made of, never how far
apart two things sit. The Themes still *feel* different in density, because they draw from
different parts of the same scale — `standard` reaches for the wide end, `dark-fantasy` is
generous vertically and tight horizontally — but neither invents a value the other lacks.

Anything that is not a multiple of four is either a hairline, a font metric, or a bug.

### Radii — same names, opposite characters

`standard` is round where `dark-fantasy` is cut. This is one of the sharpest differences
between the two, and it is carried entirely by these five values.

```
--radius-xs  --radius-sm  --radius-md  --radius-lg  --radius-pill
```

### Motion

```
--dur-fast  --dur  --dur-slow  --ease-standard  --ease-emphasized  --press-scale
```

`--press-scale` is `dark-fantasy`'s clearest `none`-style value: that Theme shrinks nothing
on press, so it fills the token with `1` and answers a press by taking light away instead.
