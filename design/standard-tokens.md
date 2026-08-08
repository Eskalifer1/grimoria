# Grimoria — `standard` theme: tokens

The design system's **output** for the `standard` Theme: concrete colour values, fonts, and
weights, in the form #36 implements directly. Its input is `standard-design.md`, which fixes
no values on purpose — this is where they land instead.

Names come from `token-contract.md` and are shared with `dark-fantasy-tokens.md`; this
document supplies one Theme's values for **every** one of them. The shared spacing scale is
the single exception, declared once in the contract because its values are identical in both
Themes. Only layout metrics are left open — see the last section.

---

## 1. Palette

### Base — teal (primary accent)

| Token | Value | Used for |
|---|---|---|
| `--teal-900` | `#0A423E` | primary button, hovered |
| `--teal-700` | `#0D5A54` | brand: mark, page title, filled button, active nav label |
| `--teal-600` | `#0F6B63` | brand text needing a step down from `700` |
| `--teal-400` | `#0FB5A5` | live signal only — selected edge, unread marker, focus ring |
| `--teal-200` | `#BFE3DE` | soft brand border |
| `--teal-100` | `#E3F2F0` | brand tint fill |
| `--teal-50`  | `#EFF7F6` | faintest brand tint — active nav row background |

### Base — violet (secondary accent)

Violet **never carries an action**. It belongs to content: code surfaces and emphasis inside
what the User wrote. See `standard-design.md` §3.

| Token | Value | Used for |
|---|---|---|
| `--violet-600` | `#7C3AED` | content emphasis text |
| `--violet-500` | `#8B5CF6` | secondary content emphasis |
| `--violet-200` | `#DDCDFB` | content tint border |
| `--violet-100` | `#F1E9FE` | content tint fill — tags |
| `--violet-50`  | `#F7F2FE` | code block surface |

### Base — ink

A purple-black, not a blue one. That warmth is what keeps a title from reading cold beside
the teal (`standard-design.md` §3).

`--ink-400` is darkened from the generated bundle's `#8A85A0`, which reached only **3.53:1**
on white. Metadata here is 11–12px monospace — small text with no contrast headroom to
spare, and the one place in this Theme where a failure would be systematic rather than
incidental. `#6E6885` reads 5.27:1 on white and 4.94:1 on the sunken surface.

| Token | Value | Used for |
|---|---|---|
| `--ink-900` | `#150B2B` | titles |
| `--ink-700` | `#2D2545` | body text |
| `--ink-500` | `#5B5570` | muted text |
| `--ink-400` | `#6E6885` | metadata (always monospace) |
| `--ink-300` | `#A8A4B8` | disabled text, idle status |

### Base — paper and lines

| Token | Value | Used for |
|---|---|---|
| `--paper-0`   | `#FFFFFF` | cards, sidebar |
| `--paper-50`  | `#FCFCFE` | page field — never pure white, so panels read as brighter |
| `--paper-100` | `#F7F7FB` | sunken surface, quiet hover |
| `--line-100`  | `#ECEAF2` | hairline |
| `--line-200`  | `#DFDCE9` | stronger divider |

### Semantic

Names come from `token-contract.md` and are identical to `dark-fantasy`'s. Only the values
differ.

```
--surface-page:      var(--paper-50)    --page-surface:      var(--paper-0)
--surface-card:      var(--paper-0)     --page-text:         var(--ink-700)
--surface-sidebar:   var(--paper-0)     --page-text-muted:   var(--ink-500)
--surface-raised:    var(--paper-0)     --page-rule:         var(--line-100)
--surface-inset:     var(--paper-100)   --page-code-surface: var(--violet-50)
--surface-selected:  var(--teal-50)     --page-accent:       var(--violet-600)
--surface-inverse:   var(--ink-900)     --text-on-inverse:   var(--paper-50)

--text-title:    var(--ink-900)         --border-subtle:   var(--line-100)
--text-body:     var(--ink-700)         --border-strong:   var(--line-200)
--text-muted:    var(--ink-500)         --border-brand:    var(--teal-400)
--text-meta:     var(--ink-400)         --border-disabled: var(--line-100)
--text-brand:    var(--teal-700)
--text-accent:   var(--violet-600)      --status-live: var(--teal-400)
--text-on-brand: var(--paper-0)         --status-idle: var(--ink-300)
                                        --status-done: var(--teal-700)
```

The **Page tokens resolve to ordinary white and ink**, because this Theme has one material:
the reading sheet and the chrome are the same paper. They still exist and components that
render Note content still read only them — that is what lets the same component sit on
`dark-fantasy`'s vellum sheet without knowing it moved.

Two remaining tints are not semantic and are used directly by the tint family:
`--teal-100` and `--violet-100` fill brand and content chips respectively.

---

## 2. Interactive states

```
--action-primary-bg:          var(--teal-700)
--action-primary-bg-hover:    var(--teal-900)
--action-primary-bg-pressed:  var(--teal-900)
--action-primary-fg:          var(--text-on-brand)
--action-primary-bg-disabled: var(--paper-100)
--action-primary-fg-disabled: var(--ink-300)

--action-quiet-bg:            transparent
--action-quiet-bg-hover:      var(--paper-100)
--action-quiet-fg:            var(--ink-700)
--action-quiet-fg-disabled:   var(--ink-300)

--focus-ring: 0 0 0 2px var(--teal-400)
```

Every shadow above is the ink at a low percentage rather than a hand-mixed grey, so the
whole elevation set follows if the ink is ever retuned — see `token-contract.md` § Layers.

Three rules decide the shape of this set, and each answers one of #53's acceptance criteria:

**Disabled is a colour, not an opacity.** A disabled control takes the neutral surface and
`--ink-300`, so it reads as unavailable without dimming its own children — an `opacity`
rule fades icons, borders, and text unevenly and produces a different result on every
background. The resulting contrast is deliberately low: disabled controls are exempt from
WCAG 1.4.3, and a disabled control that still looks operable is the worse failure. Actual
contrast verification for the rest of the palette happens in #36's a11y pass, per #48.

**There is no separate active/pressed colour.** Press is `scale(0.985)` with the hover
colour held, which is why `--action-primary-bg-pressed` repeats the hover value rather than
introducing a third step: it is not perceivable at these durations. The token exists because
`dark-fantasy` genuinely uses it — that Theme shrinks nothing and answers a press by taking
light away instead.

**Violet has no interactive states, by design.** It never carries an action
(`standard-design.md` §3), so hover, active, and disabled do not apply to it. This is the
answer to "interactive states for both base and accent colours", not an omission.

Never fade a control with opacity, and never lighten a filled button on hover — it darkens.

---

## 3. Elevation, light, translucency

Shadow does the lifting here, and there is no glow. `dark-fantasy` is the mirror: light
lifts, and its `--shadow-card` is `none`. Both Themes fill all six names.

```
--shadow-card:    0 1px  2px color-mix(in srgb, var(--ink-900)  4%, transparent),
                  0 10px 28px color-mix(in srgb, var(--ink-900)  6%, transparent)
--shadow-raised:  0 2px  4px color-mix(in srgb, var(--ink-900)  5%, transparent),
                  0 18px 40px color-mix(in srgb, var(--ink-900)  9%, transparent)
--shadow-modal:   0 24px 60px color-mix(in srgb, var(--ink-900) 14%, transparent)

--glow-accent-sm: none
--glow-accent-md: none
--glow-text:      none

--scrim-modal:    color-mix(in srgb, var(--ink-900) 32%, transparent)
--blur-card:      0
--blur-raised:    0
--blur-modal:     0
```

Different elevations get genuinely different shadows — a card, a popover, and a modal must
not share one (`standard-design.md` §4). The `none` and `0` values are not gaps: this Theme
has no glow by design, and every surface here is opaque, so there is nothing behind one to
blur. `dark-fantasy` fills all six with real values and zeroes `--shadow-card` instead.

**Text on the opposite value.** `--surface-inverse` is this Theme's near-black, carrying
tooltips and toasts. It is the only place `standard` sets light text on a dark surface, and
it exists so the Theme can do that at all — see `token-contract.md`.

---

## 4. Spacing, radii, motion

Spacing is a 4px step, **identical to `dark-fantasy`** and carried by Tailwind's own
utilities rather than a token — see the contract. The values below are this Theme's own.

```
--radius-xs:   6px    --dur-fast: 140ms   --ease-standard:   cubic-bezier(.2,.8,.3,1)
--radius-sm:   8px    --dur:      200ms   --ease-emphasized: cubic-bezier(.4,0,.2,1)
--radius-md:  12px    --dur-slow: 300ms   --press-scale:     0.985
--radius-lg:  14px
--radius-pill: 999px
```

Radii are generous and consistent, and the softness is the point: this theme is round where
`dark-fantasy` is cut (`standard-design.md` §4). Hover is `--dur-fast` on colour and `--dur`
on shadow.

---

## 5. Typography

All three families are on Google Fonts and load through `next/font`, per #48. Roles are the
contract's; `--font-display` and `--font-ui` resolve to one family here, separated by weight.

| Token | Family | Weights needed |
|---|---|---|
| `--font-display` | **Plus Jakarta Sans** | 700, 800 |
| `--font-ui` | **Plus Jakarta Sans** | 400, 500, 600 |
| `--font-meta` | **JetBrains Mono** | 400, 700 |
| `--font-reading` | **Literata** — *shared with `dark-fantasy`* | 400, 700 + italic |
| `--font-code` | **JetBrains Mono** — *shared with `dark-fantasy`* | 400, 700 |

**Plus Jakarta Sans** carries display and interface from one family, separated by weight and
size rather than by a second face (`standard-design.md` §5). Heavy and large it is display —
page titles, card titles, active nav label; at 400 it is body copy, form labels,
and buttons.

**JetBrains Mono** carries all metadata — dates, counts, tags, sidebar section labels — and
code inside Notes. It is chosen over a display monospace because code is primary content in
this product, not an accent. Caps labels take wide tracking; a mono stating a fact does not.

**Literata** sets the **Note body under both Themes** and is the one face `standard` does not
own — see #53 and `docs/features/dark-fantasy-theme.md`. Neither Theme may override it for
decoration. Measure roughly 68–75 characters.

### Scale

```
--fs-display-1: 48px   --fs-body-lg: 17px    --lh-tight: 1.05    --ls-display: -0.03em
--fs-display-2: 34px   --fs-body:    15px    --lh-title: 1.15    --ls-title:   -0.02em
--fs-title-1:   28px   --fs-label:   14px    --lh-snug:  1.35    --ls-body:     0
--fs-title-2:   22px   --fs-meta:    12px    --lh-body:  1.6     --ls-mono:     0.06em
--fs-title-3:   18px   --fs-micro:   11px                        --ls-mono-label: 0.14em
```

The scale above was measured off the reference image rather than derived, and is a
high-confidence approximation — treat it as a starting point that #74's render may adjust,
not as fixed truth.

---

## 6. What is deliberately not settled here

**Layout metrics** — sidebar width, rail width, page gutters, content max-width. The
generated bundle has values for all of them, but they are the template's geometry rather
than decisions about this product: a fixed `280px` sidebar and a `76px` rail were measured
off a screenshot of something else. They are settled once #74's render exists. They are not
contract tokens — the contract covers the design system's material, not the shell's
dimensions, which belong to `docs/features/site-layout.md`.

**`dark-fantasy`'s values** live in `dark-fantasy-tokens.md` and are #54's to ratify. This
document's job toward that Theme is only to fill the same names, which it now does in full.

**Component-level specifications.** #48 excludes per-component mockups on purpose; applying
these tokens to components is #36 and the coding standards (#51).
