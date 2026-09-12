# `dark-fantasy` theme: token decisions

**Values are `src/styles/dark-fantasy.css`.** Names are `token-contract.md`. This holds what the
CSS cannot say: why a value is what it is, and which are not free to change. Its input is
`dark-fantasy-design.md`.

## Contents

- Palette roles
- Interactive states
- Elevation and light
- Radii and motion
- Typography
- Deliberately not settled

## Palette roles

**Voids are warm-leaning near-blacks**, never pure black and never violet-black. `--void-black`
is the one primitive that never paints a surface — it exists because shadows here are black
rather than tinted, and a shadow needs something to derive from.

**Violet is the action accent — the light.** It emits and never prints: active navigation,
focus, halos, emitting edges, primary action. Same hue family as `standard`'s content accent,
deliberately — one brand, two roles. A violet tint filling a selected row is not the field being
violet-black; the design forbids the second, not the first.

**Blood is the content accent — the ink.** It prints and never glows: drop caps, rubrication,
tag outlines, destructive actions.

**Vellum is the reading sheet.** `--vellum-ink` on `--vellum-0` is the strongest text contrast
in the product. **Bone is text on the Chrome** — warm
off-white.

**An emitting edge is deliberately not a primitive**: `--glow-text` is violet at 35%, so it derives
from one.

## Interactive states

**Hover warms, it does not lighten.** Text moves to `--text-brand`, an 8% violet wash appears
behind, and a primary action picks up `--glow-accent-sm`. No underlines, no scale.

**Press drops the glow and darkens one step.** `--press-scale` is `1` — nothing shrinks. Where
`standard` acknowledges a press by moving the surface, this Theme takes light away.

**The primary action is a lit surface, not a saturated one.** Its fill is `--violet-light` with
near-black on top, so the button reads as _the light_ rather than an object painted in the accent
color. **Not to undo**: `--violet-core` as a fill gives **3.49:1** under near-black text where
`--violet-light` gives **9.89:1**, so hover brightens to `--violet-mist` and press drops to
`--violet-dim` — never to `--violet-core`, in either state.

**Disabled is a color pair, never `opacity`** — which applies harder here: dimming a glowing
control produces a ghost rather than a disabled one.

## Elevation and light

**Light does the lifting that shadow does in `standard`.** Cards carry no drop shadow
(`--shadow-card: none`, mirroring `standard`'s `--glow-accent-sm: none`); separation comes from
the plane-brightness rule and lit edges, and real shadow appears only on things genuinely
floating.

The glow tokens are the halo and the glow; the core is the element's own color.

### Glass, and where it stops

`--surface-card` and `--surface-raised` are translucent over a backdrop blur; where the glass stops is
`token-contract.md`.

`--surface-inverse` resolves to the vellum sheet: where `standard` inverts to near-black, this
Theme inverts to parchment. **Nothing is on it** — the toast and the tooltip both take
`--surface-raised` and its blur, so every raised surface here is glass.

## Radii and motion

Near-square — **cut where `standard` is round** — with the pill reserved for the one control
that must read as a track. Everything fades or drifts: no springs, no bounce, no entrance
animation on cards.

## Typography

**Type size and the space palette are fluid, not a fixed step per breakpoint** — both Themes
share the same `--text-*` scale and the same `--spacing-<name>` palette, declared once in
`src/styles/tokens.css`; the rule for both is `design/token-contract.md`.

The CSS names the families; what loads, and at which weights, is `src/shared/config/fonts.ts`.

**Playfair Display** carries titles, section headings, and sidebar navigation in small capitals
with wide tracking.

**Barlow** carries everything functional, the Note body as `--font-reading`, and — as
`--font-meta` — the dates, counts and section labels `standard` sets in monospace. Always small (11–14px) and letterspaced (0.08–0.14em); the
display serif never appears on these.

**JetBrains Mono is shared**; what that constrains is `token-contract.md`.

### Type scale

Tracking is the part of type that is this Theme's; the five `--ls-*` values are in the CSS.

**Playfair Display is set at the width it was drawn at.** It is a high-contrast face whose
counters close when it is tightened, so display and title take nothing where `standard` takes a
negative value.

## Deliberately not settled

**Layout metrics** belong to `docs/features/site-layout.md`.

**Runes and the filament modal** — described in the design doc. The divider ornament and the loading rune are drawn
— `design/marks.md`.

**Backdrop imagery** — local and dissolving behind mastheads, not the bundle's tiled photograph
under the whole screen.
