# `standard` theme: token decisions

**Values are `src/styles/standard.css`.** Names are `token-contract.md`. This holds what the
CSS cannot say: why a value is what it is, and which are not free to change. Its input is
`standard-design.md`.

## Contents

- Palette roles
- Interactive states
- Elevation
- Radii and motion
- Typography
- Deliberately not settled

## Palette roles

**Teal is the action accent** — brand mark, page title, filled button, active nav label. One
step is reserved: `--teal-400` is the **live signal only** (selected edge, unread marker, focus
ring), the one color permitted to feel electric.

**Violet is the content accent and never carries an action.** It belongs to what the User wrote:
code surfaces, emphasis inside a Note, tags. Violet has **no interactive states** — hover, active
and disabled do not apply.

`--teal-100` and `--violet-100` are used directly rather than through a semantic name, filling
brand and content chips.

### The one contrast fix

`--ink-400` is darkened from the generated bundle's `#8A85A0`, which reached only **3.53:1** on
white. Metadata here is 11–12px monospace — no contrast headroom, and the one place a failure
would be systematic rather than incidental. The current value reads 5.27:1 on white and 4.94:1
on the sunken surface. **Do not lighten it back.** The rest of the palette is not
contrast-verified.

## Interactive states

**Disabled is a color, never an opacity.** A disabled control takes the neutral surface and
disabled ink, reading as unavailable without dimming its own children — an `opacity` rule fades
icons, borders and text unevenly and lands differently on every background. The low contrast is
deliberate: disabled controls are exempt from WCAG 1.4.3, and one that still looks operable is
the worse failure.

**There is no separate pressed color.** Press is `--press-scale` with the hover color held, so
`--action-primary-bg-pressed` repeats the hover value rather than adding a third step that is
not perceivable at these durations. The token exists because `dark-fantasy` genuinely uses it.

**A filled button darkens on hover, never lightens.** No control is ever faded with opacity.

## Elevation

**Shadow lifts here, and there is no glow** — `--glow-*` are `none`, the mirror of
`dark-fantasy`'s `--shadow-card: none`.

Every shadow is the ink at a low percentage rather than a hand-mixed gray, so the whole set
follows if the ink is retuned. Every surface is opaque, so the blur tokens are `0`.

`--surface-inverse` is this Theme's near-black — the only place `standard` sets light text on a
dark surface, and it exists so the Theme can do that at all. **Neither the toast nor the tooltip is
on it**: both take `--surface-raised`, so one name carries every raised surface and, in
`dark-fantasy`, the blur that goes with it.

## Radii and motion

Radii are generous and consistent. Hover is `--dur-fast` on color and `--dur` on shadow.

## Typography

All three families are on Google Fonts and load through `next/font`. The CSS names the
families; these are the **weights to load**, which it does not carry:

| Token | Family | Weights |
|---|---|---|
| `--font-display` | Plus Jakarta Sans | 700, 800 |
| `--font-ui` | Plus Jakarta Sans | 400, 500, 600 |
| `--font-meta` | JetBrains Mono | 400, 700 |
| `--font-reading` | Plus Jakarta Sans | 400, 700 + italic |
| `--font-code` | JetBrains Mono — _shared_ | 400, 700 |

**Plus Jakarta Sans carries display and interface from one family**, separated by weight and
size rather than a second face. **JetBrains Mono carries all metadata** and code inside Notes —
chosen over a display monospace because code is primary content here, not an accent; caps
labels take wide tracking, a mono stating a fact does not. **JetBrains Mono is shared with
`dark-fantasy`**; what that constrains is `token-contract.md`.

### Type scale

**Size and line height are Tailwind's `text-*`, and there is no token for them** —
`token-contract.md` says why. Tracking is the part that is this Theme's, and the five `--ls-*`
values are in the CSS.

**Plus Jakarta Sans is tightened as it grows** — that is what separates a display line from a
heading when one family carries both.

## Deliberately not settled

**Layout metrics** — sidebar width, rail width, gutters, content max-width. The generated bundle
has values, but they are a template's geometry: a `280px` sidebar and `76px` rail measured off
someone else's screenshot. Not contract tokens — the contract covers material, not the shell's
dimensions, which belong to `docs/features/site-layout.md` and wait on #74.

**Component-level specs.** Applying these tokens to components is #74 and #75, and the coding
standards.
