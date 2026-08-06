# Grimoria — the brand mark

One mark, two executions. The files are `design/logo/grimoria-standard.svg` and
`design/logo/grimoria-dark-fantasy.svg`. They are **assets and specification only** — wiring
them into the app belongs to the theming ticket, not here.

**Two SVGs is the whole delivery — there are no PNG exports.** Every raster derivative
(`favicon.ico`, the SVG favicon, the PNG sizes, `apple-touch-icon`, Android and maskable icons,
the OG image) belongs to the favicon/OG ticket, which generates them in Next.js through
`app/icon.tsx` and `apple-icon.tsx` rather than shipping a folder of exports.

There is no wordmark asset and no lockup. The product name is never set as a graphic: the
sidebar head carries **the mark alone**, and nowhere in the interface is "Grimoria" rendered
as type. Everything the mark has to say about the brand, it says by itself.

---

## 1. The skeleton — shared, and the thing that must not drift

Both executions are the same figure on a `0 0 256 256` grid, centred on `128 128`.

A diamond ribbon of constant weight runs counter-clockwise from the **midpoint of the
upper-right edge** — the aperture — over the top vertex, around the left vertex, through the
bottom vertex, up to the right vertex, and then **folds back on itself** as a horizontal bar
running inward to the centre. That fold is the letter's crossbar and it is what makes the
figure a G rather than an ornament. Inside it sits a second, concentric chevron opening to
the right, its two arms cut short of the vertical axis.

| | Value |
|---|---|
| Outer ribbon, centreline | `178 78 → 128 28 → 28 128 → 128 228 → 228 128 → 128 128` |
| Inner chevron, centreline | `132 84 → 88 128 → 132 172` |
| Stroke weight | `24` — 1/10 of the mark's height. The gaps between strokes are `18.4`, so ink and air run about 4:3 |
| Angles | 45° only. No curve, no other angle, anywhere |

The mark is optically square, spans 240 of the 256 grid, and reads as a rune before it reads
as a letter. That order is deliberate: a plain G in a knowledge-base app reads as a user
initial, and the mark carries the brand with no word beside it.

**What may differ between executions**: terminals, joins, how steadily the contour is drawn,
wear, and colour. **What may not**: those coordinates. `standard` follows them exactly;
`dark-fantasy` is built by offsetting the same centrelines and letting the edge wander, so it
stays within about ±3 of them. Overlay the two files and the figures must sit on top of each
other — that is the acceptance test, not a matter of taste.

## 2. `standard`

Round caps, round joins, one unbroken run, single flat colour. The open ends are pulled back
by half a stroke so the round caps restore the skeleton's true extent — that is why the path
data starts at `169.5 69.5` rather than `178 78`.

Colour comes from `currentColor`; the consumer sets `color` (the `--text-brand` token,
`#0D5A54`). The file hardcodes no colour, so the same asset serves a filled state, a disabled
state, and print without a second file.

## 3. `dark-fantasy`

The same figure, **inscribed rather than drawn**. Where `standard` is a stroke of constant
width, this is a filled outline built by offsetting the skeleton and then letting the edge
misbehave: the contour wanders by roughly a pixel and a half, the weight breathes along the
run, and genuinely sharp vertices stay sharp while everything between them softens. It is one
hand's work on a surface, not a shape produced by a tool.

It is also **worn**, and the wear lives on the contour. The edge carries shallow gouges and a
few narrow nicks, so no stretch of it is mechanically straight; on top of that sit five **rubbed
patches**, and these are not invented. They are grey shapes lifted whole out of a traced
variant of the same figure — the one that carried them over its black — and put back on this
one where they belong.

Each patch is **centred on a contour**, not inside the stroke, and clipped to the mark — so
half of it falls off the ink and what remains bites into the edge. Centred inside the stroke
they stop being wear and become smudges in the middle of the letter.

**Every one sits on a sharp vertex** — the apex, the left vertex, the bottom vertex, the right
vertex where the ribbon folds back, and the inner chevron's own point. A corner is where an
inscription wears first, and it is where the wear is worth looking at: two contours meeting at
45° give the bite something to read against. The reference's sixth patch, a long streak partway
along the chevron's arm, was carried over and then dropped for exactly that reason — off a
corner it reads as a blemish on the letter rather than as wear.

They are anchored feature by feature rather than by one shared transform: the two figures are
not the same shape — the reference's edges run anywhere from 41° to 47° — and a single affine
map drops half of them off the stroke entirely, where the clip deletes them. They are also
enlarged — 1.8× to 2.6×, since at the reference's own scale they vanish on this figure, and a
patch loses half its area to the clip before it shows at all — and two are rotated. Rotation is
how a patch gets a different silhouette without inventing a sixth shape that was in no
source.

Placement at a point is finicky in a way worth knowing before nudging one: a patch centred a
few units short of a vertex leaves a thin wedge of ink beyond it and reads as a flat facet
cut off the corner rather than as a chipped point; one centred a few units past it is clipped
away entirely. The window is about 2 units wide, and the filled area of these traced shapes is
not centred in their bounding box, so it is found by looking rather than by arithmetic. Each
patch in the file therefore carries two transforms: the outer one anchors it to its vertex, the
inner one tunes it in place. Tune with the inner one — moving the anchor loses the reference
point the patch was measured from.

The patches **darken**. Worn ink moves toward whatever ground it sits on, and the reference's
greys lighten only because its ground is white paper; on this near-black Chrome the same wear
has to go the other way. Rendered lighter, they read as highlights lying on the mark rather
than as ink rubbed thin.

**The ink is flat, and the light sits on its contour.** No gradient across the body: a gradient
made the mark read as a rendered object rather than something inscribed. Instead the fill is
one red, and the outline carries a soft wide halo (6px, blur 3.5, 22%) with a tight rim over
it (1.6px, blur 0.7, 45%). Both are deliberately weak. Brighter, the halo closes the narrow
gap between the inner chevron and the crossbar and welds the two together.

Colour is overridden through CSS custom properties rather than `currentColor`, since three
roles cannot follow one inherited colour: `logo-ink` `#C0453C`, `logo-edge` `#FFB4AB` (that
one is `--blood-light` unchanged), and `logo-scuff` `#6B231D`. Each patch keeps the reference's
own hierarchy through its opacity — the lighter the grey it was traced from, the further
through the ink it has worn. Two consequences worth knowing before use: the two files are parameterised
differently, and inlining this one twice on a page needs its ids re-scoped.

`--blood-sigil` (`#93000A`) is deliberately not used. It is rubrication as it prints on vellum,
and on the near-black Chrome it sinks into the field — the first attempt lost the mark's whole
lower half. This asset lives on the Chrome, where that token was never meant to go.

This execution is built for a dark field. On light it disappears, by design.

## 4. What the mark may not do

- Sit in a container. No circle, badge, tile, shield, or frame — the free silhouette is the
  mark.
- Carry the product name. No lockup, in any orientation.
- Be recoloured into the other theme's palette. Teal is `standard`; red ink is
  `dark-fantasy`; nothing crosses, and violet belongs to the interface's light, not to the
  mark.
- Wobble in `standard`, or be drawn with a steady hand in `dark-fantasy`.
- Be redrawn "close enough". Downstream marks — decorative icons, the empty-state rune —
  inherit §1's grid, 45° discipline, and stroke-to-gap ratio, or they will not read as family.

## 5. Known limits

**Small sizes.** The narrowest feature is not the stroke but the 18.4-unit gap between the
bands, and at 20px that is 1.4 device pixels — below 2, which is where a light gap between two
dark strokes starts to silt up. Both executions hold to about 20px and neither is trustworthy
below it. There is no simplified
variant and no monochrome variant — a deliberate choice. The favicon/OG ticket therefore
inherits a real decision, not a mechanical export: which execution it derives from, and
whether it needs a simplified figure of its own.

**Red that glows.** `dark-fantasy-design.md` §3 says red never glows and
`dark-fantasy-tokens.md` calls a red carrying a glow "a bug against §3, not a variant" —
because in that theme red is ink and violet is light. The mark is red **and** lit along its
contour, so it stands outside both statements. It is a deliberate exception, made because the
mark is an inscription rather than a control, and it is the only one: nothing else in the
theme may take it as precedent.

**The slot beside the crossbar.** The inner chevron and the bar's end are the two things most
easily welded together. Measured on the committed file, the solid ink between them is 20–24px
apart across the bar's whole height. Two things close it, and both are easy to reintroduce by
eye: wear that thickens an edge instead of thinning it, and wear at the chevron's own point,
where a displacement runs along the bisector and moves the corner 1.4× further than the run it
belongs to. With either, the gap falls under 5px and the halo finishes the job. Re-measure that
number after any change to the wear or the light — it is not something the eye judges reliably
at this scale.

**Provenance.** The silhouette was generated with Stitch; the worn patches were lifted whole
out of a traced variant of the same figure. Neither source is authoritative — the trace's edges
range from 41° to 47° and its gaps are narrower than its strokes — and neither is kept in the
repo, which holds the written design rather than the working images it came from. §1 is the
normalised redraw and wins wherever anything disagrees with it.

**The SVGs are the source.** There is no generator behind them: the `dark-fantasy` contour was
produced by a throwaway script and is not regenerable from anything in the repo. Edit the file,
and treat §1's coordinates as the thing that must survive the edit. Do not attempt to
straighten the contour back onto them — the wander is the point, and the standard execution is
where the skeleton lives exactly.
