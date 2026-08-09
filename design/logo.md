# The brand mark

Two SVGs — `design/logo/grimoria-standard.svg` and `grimoria-dark-fantasy.svg` — are the whole
delivery. Coordinates, stroke widths and colors are read off them; this holds only what they cannot
say. Wiring the mark into the app is the theming ticket; every raster (`favicon.ico`, PNG sizes,
`apple-touch-icon`, maskable, OG) is the favicon/OG ticket, generated through `app/icon.tsx`.

**No wordmark, no lockup** — the name is never set as a graphic, and the sidebar head carries the
mark alone.

## Skeleton

A diamond ribbon, 45° only, folding back at the right vertex into a crossbar — that fold is what
makes the figure a G rather than an ornament — with a concentric chevron opening right. It **reads
as a rune before a letter**, deliberately: a plain G in a knowledge-base app reads as a user
initial.

- **`grimoria-standard.svg` is the skeleton** — exact centerlines, so its path data is the
  reference. `dark-fantasy` offsets the same centerlines and lets the edge wander within about ±3.
- **May differ**: terminals, joins, steadiness, wear, color. **May not**: the centerlines, the 45°
  discipline, ink-to-air ≈ 4:3 (gap `18.4`).
- **Acceptance test**: overlay the two files; the figures must coincide.
- `standard` is one unbroken run in `currentColor`, so one asset serves filled, disabled and print.
  Its ends pull back half a stroke — path starts `169.5 69.5` — so the round caps restore the true
  extent.

## `dark-fantasy` — wear

Inscribed, not drawn: the offset contour wanders about a pixel and a half, the weight breathes, and
genuinely sharp vertices stay sharp. Five rubbed patches, lifted from a traced variant, sit on top.

- **Centered on a contour**, clipped to the mark. Inside the stroke they read as smudges.
- **Every one on a sharp vertex** — apex, left, bottom, the fold, the chevron's point. Corners wear
  first, and two contours meeting at 45° give the bite something to read against. The reference's
  sixth, partway along an arm, was dropped: off a corner it reads as a blemish.
- **Anchored per feature, never by one shared transform.** The reference's edges run 41°–47°, so a
  single affine map drops half the patches off the stroke, where the clip deletes them. Enlarged
  1.8×–2.6× or they vanish at this scale; two rotated, to vary the silhouette without inventing a
  sixth shape.
- **They darken.** Worn ink moves toward its ground; the reference's grays lighten only because its
  ground is white paper.
- **The placement window is about 2 units**, and the filled area is not centered in the bounding
  box, so it is found by looking rather than arithmetic. Each patch carries an outer transform
  anchoring it and an inner one tuning it — **tune the inner one**; the anchor is the reference
  point it was measured from.

## `dark-fantasy` — light and color

- **Flat ink, light only on the contour.** A gradient made the mark read as a rendered object.
- **Halo and rim are deliberately weak** — brighter, the halo closes the gap between chevron and
  crossbar and welds them.
- **CSS custom properties, not `currentColor`**: ink, edge and scuff cannot follow one inherited
  color, and each patch keeps its hierarchy through opacity. So the two files are parameterized
  differently, and inlining this one twice on a page needs its ids re-scoped.
- **`--blood-sigil` is unused deliberately** — rubrication as it prints on vellum sinks into the
  near-black Chrome and loses the mark's whole lower half.
- **Built for a dark field.** On light it disappears, by design.

## Never

- A container — circle, badge, tile, shield or frame. The free silhouette is the mark.
- The product name, in any orientation.
- The other theme's palette: teal is `standard`, red ink is `dark-fantasy`, and violet belongs to
  the interface's light rather than to the mark.
- A wobble in `standard`, or a steady hand in `dark-fantasy`.
- Redrawn "close enough" — downstream marks, decorative icons and the empty-state rune inherit the
  grid, the 45° discipline and the stroke-to-gap ratio, or they stop reading as family.

## Limits

- **A ~20px floor.** The narrowest feature is not the stroke but the `18.4` gap: at 20px that is 1.4
  device pixels, under the 2 where a light gap between dark strokes silts up. No simplified and no
  monochrome variant exists, deliberately — the favicon/OG ticket inherits the decision of which
  execution to derive from and whether it needs a simplified figure.
- **Red that glows is the one exception.** The design forbids it and the token doc calls it a bug;
  the mark is red *and* lit because it is an inscription rather than a control. Nothing else may
  take it as precedent.
- **The slot beside the crossbar is 20–24px** of solid ink across the bar's whole height. Wear that
  thickens an edge, or wear at the chevron's point — where a displacement along the bisector moves
  the corner 1.4× further than the run it belongs to — drops it under 5px and the halo welds it
  shut. **Re-measure after any change to the wear or the light**; the eye misjudges it at this
  scale.
- **There is no generator.** The `dark-fantasy` contour came from a throwaway script that was not
  kept, so edit the files and never re-derive them. Do not straighten the contour back onto the
  skeleton — the wander is the point.
- **Provenance is not authoritative.** The silhouette came from Stitch, the patches from a traced
  variant whose edges run 41°–47° with gaps narrower than its strokes; neither is kept in the repo.
