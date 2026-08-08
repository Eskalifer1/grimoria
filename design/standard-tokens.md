# `standard` theme: token decisions

**Values are `src/styles/standard.css`.** Names are `token-contract.md`. This holds what the
CSS cannot say: why a value is what it is, and which are not free to change. Its input is
`standard-design.md`.

## Palette roles

**Teal is the action accent** — brand mark, page title, filled button, active nav label. One
step is reserved: `--teal-400` is the **live signal only** (selected edge, unread marker, focus
ring), the one colour permitted to feel electric.

**Violet is the content accent and never carries an action.** It belongs to what the User wrote:
code surfaces, emphasis inside a Note, tags. That restriction is the whole point of having it,
so violet has **no interactive states** — hover, active and disabled do not apply. An answer,
not an omission.

**Ink is a purple-black, not a blue one** — that warmth keeps a title from reading cold beside
the teal. **The field is never pure white**, so white panels read as brighter than their
surroundings; that single relationship does most of the depth work in a light UI.

`--teal-100` and `--violet-100` are used directly rather than through a semantic name, filling
brand and content chips.

**The Page tokens resolve to ordinary paper**, because this Theme has one material. They still
exist, and components rendering Note content read only them — that is what lets the same
component sit on `dark-fantasy`'s vellum sheet without knowing it moved.

### The one contrast fix

`--ink-400` is darkened from the generated bundle's `#8A85A0`, which reached only **3.53:1** on
white. Metadata here is 11–12px monospace — no contrast headroom, and the one place a failure
would be systematic rather than incidental. The current value reads 5.27:1 on white and 4.94:1
on the sunken surface. **Do not lighten it back.** Verification for the rest of the palette is
#36's a11y pass.

## Interactive states

**Disabled is a colour, never an opacity.** A disabled control takes the neutral surface and
disabled ink, reading as unavailable without dimming its own children — an `opacity` rule fades
icons, borders and text unevenly and lands differently on every background. The low contrast is
deliberate: disabled controls are exempt from WCAG 1.4.3, and one that still looks operable is
the worse failure.

**There is no separate pressed colour.** Press is `--press-scale` with the hover colour held, so
`--action-primary-bg-pressed` repeats the hover value rather than adding a third step that is
not perceivable at these durations. The token exists because `dark-fantasy` genuinely uses it.

**A filled button darkens on hover, never lightens.** No control is ever faded with opacity.

## Elevation

**Shadow lifts here, and there is no glow** — `--glow-*` are `none`, the mirror of
`dark-fantasy`'s `--shadow-card: none`. Neither Theme has a missing declaration.

Every shadow is the ink at a low percentage rather than a hand-mixed grey, so the whole set
follows if the ink is retuned. **Different elevations get genuinely different shadows** — a
card, a popover and a modal must not share one. Every surface is opaque, so the blur tokens are
`0`.

`--surface-inverse` is this Theme's near-black, carrying tooltips and toasts — the only place
`standard` sets light text on a dark surface, and it exists so the Theme can do that at all.

## Radii and motion

Radii are generous and consistent, and the softness is the point: **round where `dark-fantasy`
is cut**. Hover is `--dur-fast` on colour and `--dur` on shadow.

## Typography

All three families are on Google Fonts and load through `next/font`. The CSS names the
families; these are the **weights to load**, which it does not carry:

| Token | Family | Weights |
|---|---|---|
| `--font-display` | Plus Jakarta Sans | 700, 800 |
| `--font-ui` | Plus Jakarta Sans | 400, 500, 600 |
| `--font-meta` | JetBrains Mono | 400, 700 |
| `--font-reading` | Literata — _shared_ | 400, 700 + italic |
| `--font-code` | JetBrains Mono — _shared_ | 400, 700 |

**Plus Jakarta Sans carries display and interface from one family**, separated by weight and
size rather than a second face. **JetBrains Mono carries all metadata** and code inside Notes —
chosen over a display monospace because code is primary content here, not an accent; caps
labels take wide tracking, a mono stating a fact does not. **Literata sets the Note body under
both Themes** at a measure of roughly 68–75 characters, and neither Theme may override it.

### Type scale

Not in the CSS — Tailwind's `text-*` still owns font size until #79 settles one set of names
across both Themes.

```
--fs-display-1: 48px   --fs-body-lg: 17px    --lh-tight: 1.05    --ls-display: -0.03em
--fs-display-2: 34px   --fs-body:    15px    --lh-title: 1.15    --ls-title:   -0.02em
--fs-title-1:   28px   --fs-label:   14px    --lh-snug:  1.35    --ls-body:     0
--fs-title-2:   22px   --fs-meta:    12px    --lh-body:  1.6     --ls-mono:     0.06em
--fs-title-3:   18px   --fs-micro:   11px                        --ls-mono-label: 0.14em
```

Measured off the reference image rather than derived — a high-confidence approximation #74's
render may adjust, not fixed truth.

## Deliberately not settled

**Layout metrics** — sidebar width, rail width, gutters, content max-width. The generated bundle
has values, but they are a template's geometry: a `280px` sidebar and `76px` rail measured off
someone else's screenshot. Not contract tokens — the contract covers material, not the shell's
dimensions, which belong to `docs/features/site-layout.md` and wait on #74.

**Component-level specs.** Applying these tokens to components is #36 and the coding standards.
