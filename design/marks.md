# The decorative marks

Four SVGs under `design/marks/` — `rule-mark-dark-fantasy.svg`, `loading-rune-dark-fantasy.svg`,
`loading-rune-standard.svg` and `filament-corner-dark-fantasy.svg` — are the drawings. Coordinates, stroke widths, opacities and
colors are read off them; this holds only what they cannot say. The brand mark they descend from is
`design/logo.md`; the components that place them are `docs/features/loader-and-rule.md` and
`docs/features/modals.md`.

**`standard` has no rule mark.** Its design closes the masthead with a plain hairline. Its loading
rune is the `dark-fantasy` rune's skeleton in `currentColor`, the way `grimoria-standard.svg` is the
logo's.

## Family

Both are siblings of `design/logo/grimoria-dark-fantasy.svg`, executed as `design/logo.md`
describes.

- **The rule mark** is a diamond bracketed by two concentric chevrons, symmetric about `x = 128`.
- **The loading rune** is two concentric diamond rings — each a stroked diamond, hollow, the
  inner one at the logo's chevron scale.
- **The filament corner is growth, not carving** — a stem on the panel's edge, with
  leaves and pea-like curls turning inward into the panel's padding; nothing crosses
  the edge outward. The panel's corner is the origin, and a radial mask dims the vine with
  distance so no end is cut. Drawn top-left, turned about for bottom-right. It is the one
  exception to red ink: `ModalFrame` sets its `--logo-*` from `--filament-*`, violet, because the frame emits and blood never glows.
- **Color through the logo's custom properties** — `--logo-ink`, `--logo-edge`, `--logo-scuff` —
  so one style block recolors the logo and the marks together.
- **Ids are scoped per file** — `grimoria-rule-*`, `grimoria-loading-*`, `grimoria-filament-*` —
  so the marks and the logo inline on one page. The corner is inlined twice; its duplicate ids
  resolve to identical filters and masks, which is why that holds.
- **Acceptance test**: every centerline segment sits at 45° and every parallel neighbor is `42.4`
  apart.

## The frame

**The filament file is the corner alone**; the sides are a CSS ring on the panel, lit in two
runs and dark between, so the frame fits any size without a stretched drawing. `ModalFrame`
in `ModalFrame` in `src/shared/components/ModalFrame/` is the recipe, ring included, drawn in
`dark-fantasy` alone.

## The divider

**The rule mark's file is the mark alone**; the line is CSS on either side, so the divider
stretches to any width while the mark keeps a fixed size. `Rule` in `src/shared/components/Rule/`
is the recipe.

## The light

**Every mark animates from inside its file**: a `<style>` block whose `@keyframes` run inside
`@media (prefers-reduced-motion: no-preference)`, so under `reduce` each holds at the logo's own
light. **The rule mark breathes** — halo and rim to full, the ink halfway to the edge light. **The
loading rune carries light running along its groove** — the skeleton centerlines, dashed and
clipped to the ink, one runner per ring, the two moving against each other. **The filament's halo and buds breathe**,
the stem and leaves still. The ink never moves, and no figure rotates: the light passes over it.

## Limits

- **Floors: the rule mark at 24 px or larger, the loading rune at 32 px or larger.** Below them the
  `18.4` gap silts up, as `design/logo.md` §Limits records. The rule mark is wider than tall, so
  24 px is its width.
- **The halo stays at the logo's strength.** Brighter, it closes the gap between chevron and
  diamond, and between ring and inner diamond.
- **There is no generator.** Edit the files; never straighten the contour back onto the grid.
- **Hide motion-only layers under `prefers-reduced-motion: reduce`, never by a default the
  stylesheet then overrides.** svgo, which runs on every SVG imported under `src/`, folds a plain
  `opacity: 0` rule and then deletes the element as hidden — the runners vanished that way once.
