# Grimoria — `dark-fantasy` theme: tokens

The design system's **output** for the `dark-fantasy` Theme, filling the names in
`token-contract.md`. Its input is `dark-fantasy-design.md`, which fixes no values on purpose.

It supplies this Theme's values for **every** name in the contract. The shared spacing scale
is the single exception, declared once there because its values are identical in both Themes.
Only layout metrics are left open — see the last section.

## Provenance

One family is transcribed from a Claude Design run: the red. Everything else was derived
here, because that run was made against a screenshot of a different product — a
ritual-casting app with reagents and practitioner tiers — and it built a single-accent
crimson system in which red is also the light. That inverts this Theme's accent rule.

The neutral ramp keeps the run's **lightness steps** but not its **temperature**. Its voids
and its greys both lean cool and violet, and `dark-fantasy-design.md` §3 forbids exactly
that, with a reason: the field must be neutral and warm-leaning so that violet light reads
as light falling on a neutral surface rather than as a tinted background. A violet-black
field would make the accent disappear into its own backdrop. The values below are the run's
ladder, warmed.

The violet family and the vellum sheet have **no counterpart in that bundle**. Everything
marked *derived* was reasoned from `dark-fantasy-design.md` and contrast-checked rather than
sampled, and it is settled — but it has never been seen at full size. The first
`dark-fantasy` render is the moment to look again, the same way #74's render may adjust
`standard`'s type scale.

---

## 1. Palette

### Voids — neutral surfaces, darkest to lightest

Warm-leaning near-blacks, never pure black and never a violet-black (§3). *Derived: the
source ladder, warmed.*

| Token | Value | Used for |
|---|---|---|
| `--void-abyss`  | `#0A0908` | the deepest plane, behind everything |
| `--void-crypt`  | `#121110` | sidebar |
| `--void-shroud` | `#171614` | the page field |
| `--void-veil`   | `#1F1D1A` | card body |
| `--void-slate`  | `#262320` | raised controls |
| `--void-ash`    | `#2C2926` | inset wells |
| `--void-bone`   | `#3A3631` | tiles, the lightest plane |
| `--void-black`  | `#000000` | shadow only — never a surface |

`--void-black` exists because real shadows in this Theme are black rather than tinted, and a
shadow needs something to derive from. It is the one primitive here that never paints a
surface: the darkest thing a User sees is `--void-abyss`.

No two adjacent planes share a brightness — `dark-fantasy-design.md` §4.

### Violet — the action accent, **the light**

It emits and never prints. Active navigation, focus, halos, emitting edges, primary action.
Same hue family as `standard`'s content accent, which is deliberate: one brand, two roles.
**Derived, not transcribed.**

| Token | Value | Used for |
|---|---|---|
| `--violet-mist`   | `#E9DDFF` | brightest emission — rare, the hottest core of a glow |
| `--violet-light`  | `#C4A9FD` | the working accent: active label, icons, focus, glow colour |
| `--violet-dim`    | `#A385F2` | the working accent, one step down — a lit surface being pressed |
| `--violet-core`   | `#7C3AED` | saturated fills — the same value as `standard`'s content accent |
| `--violet-deep`   | `#4C1D95` | pressed |
| `--violet-veil`   | `#221A2C` | ~12% over the crypt: selected navigation row |
| `--violet-shroud` | `#2C2340` | badge fill |

A violet tint filling a selected row is not the field being violet-black — §3 forbids the
second, not the first.

### Blood — the content accent, **the ink**

It prints and never glows. Drop caps, rubrication, tag outlines, destructive actions.
Transcribed, but re-roled: in the source bundle this family *was* the light.

| Token | Value | Used for |
|---|---|---|
| `--blood-mist`  | `#FFDAD6` | red text needing maximum lift off the void |
| `--blood-light` | `#FFB4AB` | red as text on the dark Chrome — destructive labels, tag outlines |
| `--blood-sigil` | `#93000A` | rubrication red as it prints on the vellum sheet |
| `--blood-clot`  | `#690005` | deepest ink, pressed destructive |

A red that carries a glow is a bug against §3, not a variant.

### Vellum — the reading sheet

The light Page the Note body sits on. **Derived, not transcribed** — the source bundle has
no light surface anywhere.

| Token | Value | Used for |
|---|---|---|
| `--vellum-0`     | `#EFE4CE` | the sheet |
| `--vellum-100`   | `#E4D8BE` | code block on the sheet |
| `--vellum-line`  | `#DCCDB0` | hairline inside the Note body |
| `--vellum-ink`   | `#2B2118` | Note body text — warm, not neutral black |
| `--vellum-muted` | `#6B5B47` | secondary text on the sheet |

`--vellum-ink` on `--vellum-0` is the strongest text contrast anywhere in the product, which
is the point of the sheet existing.

### Lines

| Token | Value | Used for |
|---|---|---|
| `--line-hair` | `#211F1C` | row and panel separators |
| `--line-etch` | `#37332E` | card frames, inset wells |

`--line-glow` — the lit edge — is **not** here: it is violet at 35% and therefore derives
from a primitive rather than being one. It lives with the other light values in §3.

### Bone — text on the Chrome

A warm off-white, closer to bone than to paper (§3). *Derived* — the source's greys are
violet-tinted, which §3 rules out for the same reason it rules out a violet field.

| Token | Value | Used for |
|---|---|---|
| `--bone-100` | `#EDE6DA` | titles |
| `--bone-300` | `#D2C9BC` | body text |
| `--bone-500` | `#9A9184` | muted and metadata |
| `--bone-700` | `#5A554D` | disabled |

### Semantic

```
--surface-page:      var(--void-shroud)     --page-surface:      var(--vellum-0)
--surface-sidebar:   var(--void-crypt)      --page-text:         var(--vellum-ink)
--surface-inset:     var(--void-ash)        --page-text-muted:   var(--vellum-muted)
--surface-selected:  var(--violet-veil)     --page-rule:         var(--vellum-line)
--surface-inverse:   var(--vellum-0)        --page-code-surface: var(--vellum-100)
--text-on-inverse:   var(--vellum-ink)      --page-accent:       var(--blood-sigil)

/* the two translucent surfaces — see "Glass, and where it stops" */
--surface-card:   color-mix(in srgb, var(--void-veil)  86%, transparent)
--surface-raised: color-mix(in srgb, var(--void-slate) 82%, transparent)

--text-title:    var(--bone-100)            --border-subtle:   var(--line-hair)
--text-body:     var(--bone-300)            --border-strong:   var(--line-etch)
--text-muted:    var(--bone-500)            --border-brand:    var(--violet-light)
--text-meta:     var(--bone-500)            --border-disabled: var(--line-hair)
--text-brand:    var(--violet-light)
--text-accent:   var(--blood-light)         --status-live: var(--violet-light)
--text-on-brand: var(--void-abyss)          --status-idle: var(--bone-500)
                                            --status-done: var(--violet-core)
```

---

## 2. Interactive states

```
--action-primary-bg:          var(--violet-light)
--action-primary-bg-hover:    var(--violet-mist)
--action-primary-bg-pressed:  var(--violet-dim)
--action-primary-fg:          var(--void-abyss)
--action-primary-bg-disabled: var(--void-slate)
--action-primary-fg-disabled: var(--bone-700)

--action-quiet-bg:            transparent
--action-quiet-bg-hover:      color-mix(in srgb, var(--violet-light) 8%, transparent)
--action-quiet-fg:            var(--text-body)
--action-quiet-fg-disabled:   var(--bone-700)

--focus-ring: 0 0 0 1px var(--violet-light),
              0 0 16px color-mix(in srgb, var(--violet-light) 25%, transparent)
```

Three rules, and each is this Theme's answer to a rule `standard` answers differently:

**Hover warms, it does not lighten.** Text moves from `--text-body` to `--text-brand`, an 8%
violet wash appears behind, and a primary action picks up `--glow-accent-sm`. Navigation rows
take the same wash and lift their label. No underlines, no scale.

**Press drops the glow and darkens one step.** `--press-scale` is `1` here: nothing shrinks.
Where `standard` acknowledges a press by moving the surface, this Theme does it by taking
light away, which is the same gesture in the opposite material.

**The primary action is a lit surface, not a saturated one.** Its fill is `--violet-light`
with near-black on top, so the button reads as the light rather than as an object painted in
the accent colour — which is what "violet is light" means when it has to become a control.
It also fixes an accessibility failure: the saturated `--violet-core` as a fill gives only
**3.49:1** under near-black text, while `--violet-light` gives 9.89:1. Hover brightens to
`--violet-mist` rather than darkening, because in this Theme hover warms; press falls to
`--violet-dim`, which is the same light one step down.

`--violet-dim` exists only so that press has somewhere to go. Dropping straight to the
saturated `--violet-core` was the first attempt and it fails the same way the fill did —
3.49:1 for as long as the pointer is held. A transient state is a weak place to spend a
contrast failure, but it is still a failure, and the ramp had an obvious gap to fill.

**Disabled is a colour pair, as in `standard`** — the raised surface with a dimmed
foreground. Never `opacity`, for the reasons in `standard-tokens.md` §2, which apply harder
here: dimming a glowing control produces a ghost rather than a disabled one.

---

## 3. Elevation, light, translucency

Light does the lifting that shadow does in `standard`. Cards inside the field carry no drop
shadow — separation comes from the plane brightness rule and from lit edges. Real shadow
appears only on things genuinely floating.

```
--shadow-card:    none
--shadow-raised:  0 24px 48px color-mix(in srgb, var(--void-black) 55%, transparent)
--shadow-modal:   0 32px 80px color-mix(in srgb, var(--void-black) 70%, transparent)

--glow-accent-sm: 0 0 12px color-mix(in srgb, var(--violet-light) 18%, transparent)
--glow-accent-md: 0 0 28px color-mix(in srgb, var(--violet-light) 24%, transparent)
--glow-text:      0 0 18px color-mix(in srgb, var(--violet-light) 35%, transparent)

--line-glow:      color-mix(in srgb, var(--violet-light) 35%, transparent)

--scrim-modal:    color-mix(in srgb, var(--void-abyss) 78%, transparent)
--blur-card:      8px
--blur-raised:    8px
--blur-modal:     14px
```

`--shadow-card: none` is the mirror of `standard`'s `--glow-accent-sm: none`. Each Theme
fills the other's empty slot, and neither has a missing declaration.

### Glass, and where it stops

`--surface-card` and `--surface-raised` are translucent over a backdrop blur. This is not
decoration: §4 names semi-transparent panels sitting on the atmosphere as the Theme's
**primary depth mechanism** — the scene reads through them, and that is what makes a dark
screen read as layered rather than flat.

It stops at three surfaces, and the boundary is what §8 means by barring frosted glass as
the *default*:

- **The field** (`--surface-page`) is opaque. It is what everything else is transparent *to*.
- **The sidebar** (`--surface-sidebar`) is opaque. It is chrome, not a floating panel, and a
  translucent sidebar over a moving list is unreadable.
- **The reading sheet** (`--page-surface`) is opaque. It is a physical object lying on the
  field, and long-form reading may never be compromised by theme decoration (§2).

A dialog's body is opaque too, over a `--blur-modal` scrim: a decision should not have the
site reading through it.

**Text on the opposite value.** `--surface-inverse` resolves to the vellum sheet — this
Theme's light material. Where `standard` inverts to near-black for a tooltip, this Theme
inverts to parchment, which is the same gesture in the opposite material.

A glow is built from a wide dim halo, a medium glow, and a thin bright core — a single
stroke never reads as emission (`dark-fantasy-design.md` §4). The three tokens above are the
halo and the glow; the core is the element's own colour.

---

## 4. Spacing, radii, motion

Spacing is `--space-N = N × 4px`, **identical to `standard`** — see the contract. Rhythm is
structural; this Theme draws from the same scale, generous vertically and tight horizontally
inside controls. The values below are this Theme's own.

```
--radius-xs:   2px    --dur-fast: 120ms   --ease-standard:   cubic-bezier(.2,0,0,1)
--radius-sm:   4px    --dur:      220ms   --ease-emphasized: cubic-bezier(.05,.7,.1,1)
--radius-md:   6px    --dur-slow: 420ms   --press-scale:     1
--radius-lg:  10px
--radius-pill: 999px
```

Near-square: this Theme is cut where `standard` is round, and the pill is reserved for the
one control that must read as a track. `--press-scale: 1` is the contract's clearest
`none`-style value — nothing shrinks here, and a press is answered by the glow dropping and
the fill darkening one step.

Everything fades or drifts. No springs, no bounce, no entrance animation on cards.

---

## 5. Typography

Four voices, all four named in the contract. Two are this Theme's own; two are shared.

| Role | Family | Weights |
|---|---|---|
| `--font-display` | **Playfair Display** | 400, 500, 600, 700 + italic |
| `--font-ui` | **Barlow** | 400, 500, 600, 700 |
| `--font-meta` | **Barlow** — letterspaced caps | 500, 600 |
| `--font-reading` | **Literata** — *shared with `standard`* | 400, 700 + italic |
| `--font-code` | **JetBrains Mono** — *shared with `standard`* | 400, 700 |

**Playfair Display** carries page and Note titles, section headings, and
sidebar navigation in small capitals with wide tracking. High-contrast and classical, and it
holds its weight at small sizes on a dark field where a finer old-style serif would go thin
and shimmer.

**Barlow** carries everything functional — buttons, form labels, input text, tooltips,
tables — and, as `--font-meta`, the dates, counts, and section labels that `standard` sets in
monospace. Always small (11–14px) and letterspaced (0.08–0.14em). The display serif never
appears on these.

**Literata and JetBrains Mono are not this Theme's to change.** They set the Note body and
its code on the vellum sheet, identically in both Themes. See `token-contract.md` for why.

### Scale

```
--fs-display: 52px   --fs-body-lg: 20px   --lh-display: 1.08
--fs-h1:      40px   --fs-body:    17px   --lh-heading: 1.18   --ls-caps:     .14em
--fs-h2:      32px   --fs-label:   13px   --lh-body:    1.6    --ls-label:    .08em
--fs-h3:      24px   --fs-micro:   11px   --lh-ui:      1.35
--fs-h4:      20px
```

Measured off the source screenshot rather than derived, and that screenshot was of a
different product with a different information density. Treat this scale as weaker than
`standard`'s — a starting point for #54's render, not a decision.

---

## 6. What is deliberately not settled here

**Layout metrics** — rail width, gutters, content max-width. The source bundle has them, but
they encode a ritual-casting app's geometry: a `216px` rail and a `48px` top bar, for a bar
this product does not have. Not contract tokens; they belong to
`docs/features/site-layout.md` and wait on #74.

**Runes and the filament modal.** `dark-fantasy-design.md` §5 and §7 describe both, and the
source bundle contains neither in a usable form — it renders a plain blurred dialog and a
decorative spinning sigil. They belong to #54 and #56, not to a token document.

**Backdrop imagery.** Settled as local and dissolving behind mastheads (§4), not as the
bundle's tiled photograph under the whole screen. No asset exists yet.
