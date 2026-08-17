# Accessibility

What this project promises a keyboard and screen-reader user, and who enforces each part. How a
surface is reviewed against it is `.claude/skills/a11y-review/SKILL.md`; what a review may report at
all is `review-boundaries.md`.

**The target is WCAG 2.2 level AA**, and a finding cites its success criterion by number.

## What holds each part

**Biome holds the single-file rules.** The `a11y` recommended preset runs on every `yarn check`
(`biome.json`) — alt text, button type, valid ARIA props, click handlers on static elements. Nothing
in that set needs a doc or a review; it is red at the gate.

**Review holds what spans files or branches**, across seven categories: semantics and landmarks,
accessible name, keyboard reach and focus movement, ARIA state that tracks real state, form label
and error wiring, announcement of dynamic states, and locale markup.

**Tokens hold contrast and focus rings.** Color and focus styling come from `src/styles/standard.css`
and `dark-fantasy.css` per `styling.md`, so a component cannot get them wrong by itself and neither
lint nor review checks them per use.

## What we always hold

- **Every action is reachable and operable from the keyboard alone**, in the order it reads.
- **Every interactive element and every image resolves to a name** a screen reader can speak.
- **Every state change a user triggers is announced** — loading, empty, and error regions included.
- **Both Themes meet it.** A surface passes in `standard` and `dark-fantasy` or it does not pass.

Which diffs earn the axis is decided by `.claude/bin/review-context.sh`, not restated here.
