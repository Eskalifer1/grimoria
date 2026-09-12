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
not perceivable at these durations.

**A filled button darkens on hover, never lightens.** No control is ever faded with opacity.

## Elevation

**Shadow lifts here, and there is no glow** — `--glow-*` are `none`, the mirror of
`dark-fantasy`'s `--shadow-card: none`.

Every shadow is the ink at a low percentage rather than a hand-mixed gray, so the whole set
follows if the ink is retuned. Every surface is opaque, so the blur tokens are `0`.

`--surface-inverse` is this Theme's near-black — the only place `standard` sets light text on a
dark surface. **Neither the toast nor the tooltip is
on it**: both take `--surface-raised`, so one name carries every raised surface and, in
`dark-fantasy`, the blur that goes with it.

## Radii and motion

Hover is `--dur-fast` on color and `--dur` on shadow.

## Typography

**Type size and the space palette are fluid, not a fixed step per breakpoint** — both Themes
share the same `--text-*` scale and the same `--spacing-<name>` palette, declared once in
`src/styles/tokens.css`; the rule for both is `design/token-contract.md`.

The CSS names the families; what loads, and at which weights, is `src/shared/config/fonts.ts`.

**Plus Jakarta Sans carries display and interface from one family**, separated by weight and
size rather than a second face. **JetBrains Mono carries all metadata** and code inside Notes. **JetBrains Mono is shared with
`dark-fantasy`**; what that constrains is `token-contract.md`.

### Type scale

Tracking is the part of type that is this Theme's; the five `--ls-*` values are in the CSS.

**Plus Jakarta Sans is tightened as it grows** — that is what separates a display line from a
heading when one family carries both.

## Deliberately not settled

**Layout metrics** — sidebar width, rail width, gutters, content max-width. Not contract tokens — the contract covers material, not the shell's
dimensions, which belong to `docs/features/site-layout.md`.
