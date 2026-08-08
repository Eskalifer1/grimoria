# `dark-fantasy` theme: token decisions

**Values are `src/styles/dark-fantasy.css`.** Names are `token-contract.md`. This holds what the
CSS cannot say: why a value is what it is, and which are not free to change. Its input is
`dark-fantasy-design.md`.

## Provenance

One family is transcribed from a Claude Design run: the red. Everything else was **derived**
here, because that run was made against a screenshot of a different product — a ritual-casting
app — and built a single-accent crimson system in which red is also the light. That inverts this
Theme's accent rule.

The neutral ramp keeps the run's **lightness steps** but not its **temperature**: its voids and
greys lean cool and violet, which the design document forbids, because the field must be
neutral and warm-leaning so violet reads as light falling on a neutral surface rather than a
tinted background. A violet-black field would make the accent disappear into its own backdrop.

The violet family and the vellum sheet have **no counterpart in that bundle**. Everything
derived was reasoned and contrast-checked rather than sampled, and it is settled — but has never
been seen at full size. The first `dark-fantasy` render is the moment to look again.

## Palette roles

**Voids are warm-leaning near-blacks**, never pure black and never violet-black. `--void-black`
is the one primitive that never paints a surface — it exists because shadows here are black
rather than tinted, and a shadow needs something to derive from. The darkest thing a User sees
is `--void-abyss`. **No two adjacent planes share a brightness.**

**Violet is the action accent — the light.** It emits and never prints: active navigation,
focus, halos, emitting edges, primary action. Same hue family as `standard`'s content accent,
deliberately — one brand, two roles. A violet tint filling a selected row is not the field being
violet-black; the design forbids the second, not the first.

**Blood is the content accent — the ink.** It prints and never glows: drop caps, rubrication,
tag outlines, destructive actions. Transcribed but **re-roled** — in the source bundle this
family _was_ the light. A red carrying a glow is a bug, not a variant.

**Vellum is the reading sheet.** `--vellum-ink` on `--vellum-0` is the strongest text contrast
in the product, which is the point of the sheet existing. **Bone is text on the Chrome** — warm
off-white, because the source's violet-tinted greys are ruled out for the same reason a violet
field is.

`--line-glow` is deliberately **not** a primitive: it is violet at 35%, so it derives from one.

## Interactive states

**Hover warms, it does not lighten.** Text moves to `--text-brand`, an 8% violet wash appears
behind, and a primary action picks up `--glow-accent-sm`. No underlines, no scale.

**Press drops the glow and darkens one step.** `--press-scale` is `1` — nothing shrinks. Where
`standard` acknowledges a press by moving the surface, this Theme takes light away.

**The primary action is a lit surface, not a saturated one.** Its fill is `--violet-light` with
near-black on top, so the button reads as _the light_ rather than an object painted in the
accent colour — which is what "violet is light" means when it becomes a control.

That also fixes an accessibility failure, and this is the part not to undo: saturated
`--violet-core` as a fill gives only **3.49:1** under near-black text, where `--violet-light`
gives **9.89:1**. Hover brightens to `--violet-mist` rather than darkening. `--violet-dim`
exists only so press has somewhere to go — dropping straight to `--violet-core` was the first
attempt and fails the same way, 3.49:1 for as long as the pointer is held.

**Disabled is a colour pair, never `opacity`** — which applies harder here: dimming a glowing
control produces a ghost rather than a disabled one.

## Elevation and light

**Light does the lifting that shadow does in `standard`.** Cards carry no drop shadow
(`--shadow-card: none`, mirroring `standard`'s `--glow-accent-sm: none`); separation comes from
the plane-brightness rule and lit edges, and real shadow appears only on things genuinely
floating.

A glow is a wide dim halo, a medium glow, and a thin bright core — a single stroke never reads
as emission. The glow tokens are the halo and the glow; the core is the element's own colour.

### Glass, and where it stops

`--surface-card` and `--surface-raised` are translucent over a backdrop blur — not decoration:
semi-transparent panels on the atmosphere are the Theme's **primary depth mechanism**, and what
makes a dark screen read as layered rather than flat.

It stops at three surfaces, which is what "no frosted glass as the _default_ surface" means:
**the field** is opaque, being what everything else is transparent _to_; **the sidebar** is
opaque, because it is chrome and a translucent sidebar over a moving list is unreadable; **the
reading sheet** is opaque, because it is a physical object and long-form reading is never
compromised by decoration. A dialog's body is opaque too, over a `--blur-modal` scrim.

`--surface-inverse` resolves to the vellum sheet: where `standard` inverts to near-black for a
tooltip, this Theme inverts to parchment.

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

Not in the CSS — Tailwind's `text-*` still owns font size until #79.

```
--fs-display: 52px   --fs-body-lg: 20px   --lh-display: 1.08
--fs-h1:      40px   --fs-body:    17px   --lh-heading: 1.18   --ls-caps:  .14em
--fs-h2:      32px   --fs-label:   13px   --lh-body:    1.6    --ls-label: .08em
--fs-h3:      24px   --fs-micro:   11px   --lh-ui:      1.35
--fs-h4:      20px
```

Measured off the source screenshot, a different product at a different density. **Weaker than
`standard`'s** — a starting point for #54's render, not a decision.

## Deliberately not settled

**Layout metrics** — the source bundle's `216px` rail and `48px` top bar encode a ritual-casting
app's geometry, for a bar this product does not have. They belong to
`docs/features/site-layout.md` and wait on #74.

**Runes and the filament modal** — described in the design doc; the bundle renders a plain
blurred dialog and a spinning sigil instead. #54 and #56.

**Backdrop imagery** — local and dissolving behind mastheads, not the bundle's tiled photograph
under the whole screen. No asset exists yet.
