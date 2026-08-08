# The brand mark

One mark, two executions: `design/logo/grimoria-standard.svg` and
`grimoria-dark-fantasy.svg`. **Assets and specification only** — wiring them into the app
belongs to the theming ticket.

**Two SVGs is the whole delivery.** Every raster derivative — `favicon.ico`, the SVG favicon,
PNG sizes, `apple-touch-icon`, Android and maskable icons, the OG image — belongs to the
favicon/OG ticket, which generates them through `app/icon.tsx` rather than shipping a folder of
exports.

**There is no wordmark and no lockup.** The product name is never set as a graphic: the sidebar
head carries the mark alone, and nowhere in the interface is "Grimoria" rendered as type.

## The skeleton — shared, and the thing that must not drift

Both executions are the same figure on a `0 0 256 256` grid, centred on `128 128`.

A diamond ribbon of constant weight runs counter-clockwise from the **midpoint of the
upper-right edge** — the aperture — over the top vertex, around the left vertex, through the
bottom vertex, up to the right vertex, then **folds back on itself** as a horizontal bar running
inward to the centre. That fold is the crossbar, and it is what makes the figure a G rather than
an ornament. Inside it sits a second, concentric chevron opening to the right, its arms cut
short of the vertical axis.

| | Value |
|---|---|
| Outer ribbon, centreline | `178 78 → 128 28 → 28 128 → 128 228 → 228 128 → 128 128` |
| Inner chevron, centreline | `132 84 → 88 128 → 132 172` |
| Stroke weight | `24` — 1/10 of the height. Gaps are `18.4`, so ink and air run about 4:3 |
| Angles | 45° only. No curve, no other angle, anywhere |

The mark is optically square, spans 240 of the 256 grid, and **reads as a rune before it reads
as a letter** — deliberate, since a plain G in a knowledge-base app reads as a user initial.

**May differ between executions**: terminals, joins, steadiness of the contour, wear, colour.
**May not**: those coordinates. `standard` follows them exactly; `dark-fantasy` offsets the same
centrelines and lets the edge wander within about ±3. **Overlay the two files and the figures
must sit on top of each other** — that is the acceptance test, not a matter of taste.

## `standard`

Round caps and joins, one unbroken run, single flat colour. The open ends are pulled back by
half a stroke so the round caps restore the skeleton's true extent — which is why the path data
starts at `169.5 69.5` rather than `178 78`.

Colour comes from `currentColor`, so one asset serves filled, disabled, and print.

## `dark-fantasy`

The same figure, **inscribed rather than drawn**: a filled outline built by offsetting the
skeleton and then letting the edge misbehave. The contour wanders by roughly a pixel and a
half, the weight breathes along the run, and genuinely sharp vertices stay sharp while
everything between them softens. One hand's work on a surface, not a shape produced by a tool.

### The wear

The edge carries shallow gouges and narrow nicks, so no stretch is mechanically straight. On top
sit **five rubbed patches**, lifted whole out of a traced variant of the same figure.

- **Each is centred on a contour**, not inside the stroke, and clipped to the mark — so half
  falls off the ink and what remains bites into the edge. Centred inside the stroke they become
  smudges in the middle of the letter.
- **Every one sits on a sharp vertex** — apex, left vertex, bottom vertex, the right vertex
  where the ribbon folds back, and the chevron's own point. A corner is where an inscription
  wears first, and two contours meeting at 45° give the bite something to read against. The
  reference's sixth patch, a streak partway along the chevron's arm, was dropped for that
  reason: off a corner it reads as a blemish rather than wear.
- **Anchored feature by feature, not by one shared transform.** The two figures are not the same
  shape — the reference's edges run 41° to 47° — and a single affine map drops half of them off
  the stroke, where the clip deletes them. They are also enlarged 1.8×–2.6× (at the reference's
  scale they vanish here) and two are rotated, which gives a patch a different silhouette
  without inventing a sixth shape that was in no source.
- **They darken.** Worn ink moves toward its ground; the reference's greys lighten only because
  its ground is white paper. Rendered lighter on this near-black Chrome they read as highlights
  lying on the mark rather than ink rubbed thin.

**Placement is finicky, and worth knowing before nudging one.** A patch centred a few units
short of a vertex leaves a thin wedge of ink beyond it and reads as a facet cut off the corner;
one centred a few units past it is clipped away entirely. **The window is about 2 units wide**,
and the filled area of these traced shapes is not centred in their bounding box, so it is found
by looking rather than arithmetic. Each patch therefore carries two transforms: an outer one
anchoring it to its vertex, an inner one tuning it in place. **Tune with the inner one** —
moving the anchor loses the reference point the patch was measured from.

### The light

**The ink is flat, and the light sits on its contour.** No gradient across the body — a gradient
made the mark read as a rendered object rather than something inscribed. The fill is one red,
and the outline carries a soft wide halo (6px, blur 3.5, 22%) with a tight rim over it (1.6px,
blur 0.7, 45%). **Both are deliberately weak**: brighter, the halo closes the narrow gap between
the chevron and the crossbar and welds them together.

Colour comes from CSS custom properties rather than `currentColor`, since three roles cannot
follow one inherited colour: `logo-ink` `#C0453C`, `logo-edge` `#FFB4AB` (`--blood-light`
unchanged), `logo-scuff` `#6B231D`. Each patch keeps the reference's hierarchy through its
opacity. Two consequences: the two files are parameterised differently, and inlining this one
twice on a page needs its ids re-scoped.

`--blood-sigil` is deliberately unused — it is rubrication as it prints on vellum, and on the
near-black Chrome it sinks into the field, losing the mark's whole lower half.

**Built for a dark field. On light it disappears, by design.**

## What the mark may not do

- Sit in a container — no circle, badge, tile, shield or frame. The free silhouette is the mark.
- Carry the product name, in any orientation.
- Be recoloured into the other theme's palette. Teal is `standard`, red ink is `dark-fantasy`;
  violet belongs to the interface's light, not to the mark.
- Wobble in `standard`, or be drawn with a steady hand in `dark-fantasy`.
- Be redrawn "close enough". Downstream marks — decorative icons, the empty-state rune — inherit
  the grid, the 45° discipline and the stroke-to-gap ratio, or they will not read as family.

## Known limits

**Small sizes.** The narrowest feature is not the stroke but the 18.4-unit gap: at 20px that is
1.4 device pixels, below the 2 where a light gap between dark strokes silts up. Both executions
hold to about 20px and neither is trustworthy below it. There is no simplified and no monochrome
variant, deliberately — so the favicon/OG ticket inherits a real decision: which execution it
derives from, and whether it needs a simplified figure of its own.

**Red that glows.** The design says red never glows, and the token doc calls a red carrying a
glow a bug rather than a variant. The mark is red **and** lit along its contour, standing outside
both — a deliberate exception, made because the mark is an inscription rather than a control, and
**the only one**. Nothing else in the theme may take it as precedent.

**The slot beside the crossbar.** The chevron and the bar's end are the two things most easily
welded together. Measured on the committed file, the solid ink between them is **20–24px apart
across the bar's whole height**. Two things close it, both easy to reintroduce by eye: wear that
thickens an edge instead of thinning it, and wear at the chevron's point, where a displacement
runs along the bisector and moves the corner 1.4× further than the run it belongs to. With
either, the gap falls under 5px and the halo finishes the job. **Re-measure after any change to
the wear or the light** — the eye does not judge it reliably at this scale.

**Provenance.** The silhouette came from Stitch, the patches from a traced variant. Neither
source is authoritative — the trace's edges run 41° to 47° and its gaps are narrower than its
strokes — and neither is kept in the repo. The skeleton above is the normalised redraw and wins
wherever anything disagrees.

**The SVGs are the source.** There is no generator: the `dark-fantasy` contour came from a
throwaway script and is not regenerable. Edit the file, and treat the skeleton's coordinates as
what must survive the edit. Do not straighten the contour back onto them — the wander is the
point, and `standard` is where the skeleton lives exactly.
