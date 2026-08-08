# `dark-fantasy` theme: token decisions

**Values live in `src/styles/dark-fantasy.css`** — every colour, radius, shadow and duration,
as the app actually reads them. Names come from `token-contract.md`. This document holds what
the CSS cannot say: why a value is what it is, and which of them are not free to change.

Its input is `dark-fantasy-design.md`, which fixes no values on purpose.

## Provenance

One family is transcribed from a Claude Design run: the red. Everything else was **derived**
here, because that run was made against a screenshot of a different product — a ritual-casting
app with reagents and practitioner tiers — and it built a single-accent crimson system in
which red is also the light. That inverts this Theme's accent rule.

The neutral ramp keeps the run's **lightness steps** but not its **temperature**. Its voids
and greys both lean cool and violet, which `dark-fantasy-design.md` forbids with a reason: the
field must be neutral and warm-leaning so violet light reads as light falling on a neutral
surface rather than as a tinted background. A violet-black field would make the accent
disappear into its own backdrop.

The violet family and the vellum sheet have **no counterpart in that bundle**. Everything
derived was reasoned from the design document and contrast-checked rather than sampled, and it
is settled — but it has never been seen at full size. The first `dark-fantasy` render is the
moment to look again.

## Palette roles

**Voids are warm-leaning near-blacks**, never pure black and never violet-black. `--void-black`
is the one primitive that never paints a surface — it exists only because real shadows here
are black rather than tinted, and a shadow needs something to derive from. The darkest thing a
User sees is `--void-abyss`. **No two adjacent planes share a brightness.**

**Violet is the action accent — the light.** It emits and never prints: active navigation,
focus, halos, emitting edges, primary action. Same hue family as `standard`'s content accent,
deliberately — one brand, two roles. A violet tint filling a selected row is not the field
being violet-black; the design document forbids the second, not the first.

**Blood is the content accent — the ink.** It prints and never glows: drop caps, rubrication,
tag outlines, destructive actions. Transcribed but **re-roled** — in the source bundle this
family _was_ the light. A red carrying a glow is a bug, not a variant.

**Vellum is the reading sheet**, the light Page the Note body sits on. `--vellum-ink` on
`--vellum-0` is the strongest text contrast anywhere in the product, which is the point of the
sheet existing.

**Bone is text on the Chrome** — a warm off-white, closer to bone than to paper, because the
source's violet-tinted greys are ruled out for the same reason a violet field is.

`--line-glow` is deliberately **not** a primitive: it is violet at 35%, so it derives from one.

## Interactive states

Three rules, each this Theme's answer to something `standard` answers differently.

**Hover warms, it does not lighten.** Text moves from `--text-body` to `--text-brand`, an 8%
violet wash appears behind, and a primary action picks up `--glow-accent-sm`. Navigation rows
take the same wash and lift their label. No underlines, no scale.

**Press drops the glow and darkens one step.** `--press-scale` is `1` here — nothing shrinks.
Where `standard` acknowledges a press by moving the surface, this Theme takes light away,
which is the same gesture in the opposite material.

**The primary action is a lit surface, not a saturated one.** Its fill is `--violet-light`
with near-black on top, so the button reads as _the light_ rather than as an object painted in
the accent colour — which is what "violet is light" means when it has to become a control.

That also fixes an accessibility failure, and this is the part not to undo: the saturated
`--violet-core` as a fill gives only **3.49:1** under near-black text, where `--violet-light`
gives **9.89:1**. Hover brightens to `--violet-mist` rather than darkening, because hover
warms here. `--violet-dim` exists only so press has somewhere to go — dropping straight to
`--violet-core` was the first attempt and fails the same way, 3.49:1 for as long as the
pointer is held. A transient state is a weak place to spend a contrast failure, but it is
still a failure.

**Disabled is a colour pair, as in `standard`** — never `opacity`, which applies harder here:
dimming a glowing control produces a ghost rather than a disabled one.

## Elevation and light

**Light does the lifting that shadow does in `standard`.** Cards inside the field carry no
drop shadow — `--shadow-card: none`, the mirror of `standard`'s `--glow-accent-sm: none`.
Separation comes from the plane-brightness rule and from lit edges; real shadow appears only
on things genuinely floating.

A glow is built from a wide dim halo, a medium glow, and a thin bright core — a single stroke
never reads as emission. The glow tokens are the halo and the glow; the core is the element's
own colour.

### Glass, and where it stops

`--surface-card` and `--surface-raised` are translucent over a backdrop blur. This is not
decoration: semi-transparent panels sitting on the atmosphere are the Theme's **primary depth
mechanism** — the scene reads through them, and that is what makes a dark screen read as
layered rather than flat.

It stops at three surfaces, which is what "no frosted glass as the _default_ surface" means:

- **The field** is opaque. It is what everything else is transparent _to_.
- **The sidebar** is opaque. It is chrome, not a floating panel, and a translucent sidebar
  over a moving list is unreadable.
- **The reading sheet** is opaque. It is a physical object lying on the field, and long-form
  reading may never be compromised by theme decoration.

A dialog's body is opaque too, over a `--blur-modal` scrim: a decision should not have the
site reading through it.

`--surface-inverse` resolves to the vellum sheet. Where `standard` inverts to near-black for a
tooltip, this Theme inverts to parchment — the same gesture in the opposite material.

## Radii and motion

Near-square: this Theme is **cut where `standard` is round**, and the pill is reserved for the
one control that must read as a track. Everything fades or drifts — no springs, no bounce, no
entrance animation on cards.

Spacing is the shared 4px step, carried by Tailwind's own utilities rather than a token. This
Theme draws from the same scale, generous vertically and tight horizontally inside controls.

## Typography

Four voices; two are this Theme's own and two are shared. The CSS names the families; these
are the **weights that must be loaded**, which the CSS does not carry:

| Token | Family | Weights |
|---|---|---|
| `--font-display` | Playfair Display | 400, 500, 600, 700 + italic |
| `--font-ui` | Barlow | 400, 500, 600, 700 |
| `--font-meta` | Barlow — letterspaced caps | 500, 600 |
| `--font-reading` | Literata — _shared with `standard`_ | 400, 700 + italic |
| `--font-code` | JetBrains Mono — _shared with `standard`_ | 400, 700 |

**Playfair Display** carries page and Note titles, section headings, and sidebar navigation in
small capitals with wide tracking. High-contrast and classical, and it holds its weight at
small sizes on a dark field where a finer old-style serif would go thin and shimmer.

**Barlow** carries everything functional — buttons, form labels, input text, tooltips,
tables — and, as `--font-meta`, the dates, counts and section labels `standard` sets in
monospace. Always small (11–14px) and letterspaced (0.08–0.14em). The display serif never
appears on these.

**Literata and JetBrains Mono are not this Theme's to change.** They set the Note body and its
code on the vellum sheet, identically in both Themes.

### Type scale

Not in the CSS: Tailwind's `text-*` still owns font size until #79 settles one set of names
across both Themes.

```
--fs-display: 52px   --fs-body-lg: 20px   --lh-display: 1.08
--fs-h1:      40px   --fs-body:    17px   --lh-heading: 1.18   --ls-caps:  .14em
--fs-h2:      32px   --fs-label:   13px   --lh-body:    1.6    --ls-label: .08em
--fs-h3:      24px   --fs-micro:   11px   --lh-ui:      1.35
--fs-h4:      20px
```

Measured off the source screenshot, which was a different product at a different information
density. Treat this scale as **weaker than `standard`'s** — a starting point for #54's render,
not a decision.

## Deliberately not settled here

**Layout metrics** — rail width, gutters, content max-width. The source bundle has them, but
they encode a ritual-casting app's geometry: a `216px` rail and a `48px` top bar, for a bar
this product does not have. Not contract tokens; they belong to `docs/features/site-layout.md`
and wait on #74.

**Runes and the filament modal.** `dark-fantasy-design.md` describes both; the source bundle
contains neither in a usable form, rendering a plain blurred dialog and a decorative spinning
sigil instead. They belong to #54 and #56.

**Backdrop imagery.** Settled as local and dissolving behind mastheads, not as the bundle's
tiled photograph under the whole screen. No asset exists yet.
