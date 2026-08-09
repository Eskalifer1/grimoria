---
paths:
  - "design/logo/**"
---

# Editing the brand mark

**Read `design/logo.md` before changing either SVG.** It holds the shared skeleton, the wear and
light rules, and the limits. This file is a reminder, not a substitute.

Four things the files themselves do not say:

- **There is no generator.** The `dark-fantasy` contour came from a throwaway script that was not
  kept. A ruined contour is not regenerable — edit, never re-derive.
- **The acceptance test is an overlay.** Both executions sit on one skeleton; `standard.svg`
  follows it exactly. Overlay the two and the figures must coincide.
- **The five rubbed patches sit on sharp vertices**, centered on a contour, within a window about
  2 units wide. Each carries two transforms — tune with the inner one, never the anchor.
- **Re-measure the slot beside the crossbar** after any change to the wear or the light. Under 5px
  the halo welds the chevron to the bar, and the eye does not catch it at this scale.
