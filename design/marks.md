# The decorative marks

Three SVGs under `design/marks/` — `rule-mark-dark-fantasy.svg`, `loading-rune-dark-fantasy.svg`
and `loading-rune-standard.svg` — are the drawings. Coordinates, stroke widths, opacities and
colors are read off them; this holds only what they cannot say. The brand mark they descend from is
`design/logo.md`; the components that place them are `docs/features/loader-and-rule.md`.

**`standard` has no rule mark.** Its design closes the masthead with a plain hairline. Its loading
rune is the `dark-fantasy` rune's skeleton in `currentColor`, the way `grimoria-standard.svg` is the
logo's.

## Family

Both are siblings of `design/logo/grimoria-dark-fantasy.svg`, executed as `design/logo.md`
describes.

- **The rule mark** is a diamond bracketed by two concentric chevrons, symmetric about `x = 128`.
- **The loading rune** is two concentric diamond rings — each a stroked diamond, hollow, the
  inner one at the logo's chevron scale.
- **Color through the logo's custom properties** — `--logo-ink`, `--logo-edge`, `--logo-scuff` —
  so one style block recolors the logo and both marks together.
- **Ids are scoped per file** — `grimoria-rule-*`, `grimoria-loading-*` — so both marks and the
  logo inline on one page.
- **Acceptance test**: every centerline segment sits at 45° and every parallel neighbor is `42.4`
  apart.

## The divider

**The rule mark's file is the mark alone**; the line is CSS on either side, so the divider
stretches to any width while the mark keeps a fixed size. `Rule` in `src/shared/components/Rule/`
is the recipe.

## The light

**Both marks animate from inside their file**: a `<style>` block whose `@keyframes` run inside
`@media (prefers-reduced-motion: no-preference)`, so under `reduce` each holds at the logo's own
light. **The rule mark breathes** — halo and rim to full, the ink halfway to the edge light. **The
loading rune carries light running along its groove** — the skeleton centerlines, dashed and
clipped to the ink, one runner per ring, the two moving against each other. The ink never moves,
and the figure never rotates: the light passes over the carving.

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
