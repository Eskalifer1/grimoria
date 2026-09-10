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
rather than tinted, and a shadow needs something to derive from. The darkest thing a User sees
is `--void-abyss`.

**Violet is the action accent — the light.** It emits and never prints: active navigation,
focus, halos, emitting edges, primary action. Same hue family as `standard`'s content accent,
deliberately — one brand, two roles. A violet tint filling a selected row is not the field being
violet-black; the design forbids the second, not the first.

**Blood is the content accent — the ink.** It prints and never glows: drop caps, rubrication,
tag outlines, destructive actions. A red carrying a glow is a bug, not a variant.

**Vellum is the reading sheet.** `--vellum-ink` on `--vellum-0` is the strongest text contrast
in the product, which is the point of the sheet existing. **Bone is text on the Chrome** — warm
off-white, because the source's violet-tinted grays are ruled out for the same reason a violet
field is.

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

`--surface-card` and `--surface-raised` are translucent over a backdrop blur — not decoration:
semi-transparent panels on the atmosphere are the Theme's **primary depth mechanism**, and what
makes a dark screen read as layered rather than flat.

It stops at three surfaces, which is what "no frosted glass as the _default_ surface" means:
**the field** is opaque, being what everything else is transparent _to_; **the sidebar** is
opaque, because it is chrome and a translucent sidebar over a moving list is unreadable; **the
reading sheet** is opaque, because it is a physical object and long-form reading is never
compromised by decoration. A dialog's body is opaque too, over a `--blur-modal` scrim.

`--surface-inverse` resolves to the vellum sheet: where `standard` inverts to near-black, this
Theme inverts to parchment. **Nothing is on it** — the toast and the tooltip both take
`--surface-raised` and its blur, so every raised surface here is glass.

## Radii and motion

Near-square — **cut where `standard` is round** — with the pill reserved for the one control
that must read as a track. Everything fades or drifts: no springs, no bounce, no entrance
animation on cards.

## Typography

The CSS names the families; these are the **weights to load**, which it does not carry:

| Token | Family | Weights |
|---|---|---|
| `--font-display` | Playfair Display | 400, 500, 600, 700 + italic |
| `--font-ui` | Barlow | 400, 500, 600, 700 |
| `--font-meta` | Barlow — letterspaced caps | 500, 600 |
| `--font-reading` | Literata — _shared_ | 400, 700 + italic |
| `--font-code` | JetBrains Mono — _shared_ | 400, 700 |

**Playfair Display** carries titles, section headings, and sidebar navigation in small capitals
with wide tracking — high-contrast and classical, and it holds its weight at small sizes on a
dark field where a finer old-style serif would go thin and shimmer.

**Barlow** carries everything functional and, as `--font-meta`, the dates, counts and section
labels `standard` sets in monospace. Always small (11–14px) and letterspaced (0.08–0.14em); the
display serif never appears on these.

**Literata and JetBrains Mono are shared**; what that constrains is `token-contract.md`.

### Type scale

**Size and line height are Tailwind's `text-*`, and there is no token for them** —
`token-contract.md` says why. Tracking is the part that is this Theme's, and the five `--ls-*`
values are in the CSS.

**Playfair Display is set at the width it was drawn at.** It is a high-contrast face whose
counters close when it is tightened, so display and title take nothing where `standard` takes a
negative value.

## Deliberately not settled

**Layout metrics** — the source bundle's `216px` rail and `48px` top bar encode a ritual-casting
app's geometry, for a bar this product does not have. They belong to
`docs/features/site-layout.md` and wait on #74.

**Runes and the filament modal** — described in the design doc; the bundle renders a plain
blurred dialog and a spinning sigil instead. The icon half is #56.

**Backdrop imagery** — local and dissolving behind mastheads, not the bundle's tiled photograph
under the whole screen. No asset exists yet.
