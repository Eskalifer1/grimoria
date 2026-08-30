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
- **A live region is mounted before it has anything to say.** A `role="alert"` or `role="status"`
  element created together with its text is not a content change, and most screen readers never
  speak it; render the region empty and fill it. Empty it is `sr-only`, so it takes no space.
  One region per announcement — a second saying the same thing says it twice.
- **Focus goes somewhere when what held it is removed.** A control that disappears under the User —
  a dismissal, a delete — drops focus to the document body, which returns a keyboard User to the top
  of the page. Focus moves to the nearest thing that survived (WCAG 2.2 AA, 2.4.3).
- **Focus moved into a text field puts the caret after the value.** A browser restores the selection
  an element held the last time it was focused, and a field the User has never focused has none — so
  a bare `focus()` lands at index 0, in front of what is there, and typing prepends. `useReturnFocus`
  does this; anything else that moves focus into an editable field owes the same.
- **A dimmed state still meets contrast.** Opacity multiplies against the background, so a value at
  60% measured 4.02:1 where the token gives 14.36:1. Dim at 70%, and **never dim a message** — the
  thing that must be read is the thing that must not be faded (WCAG 2.2 AA, 1.4.3).
- **Repeated controls carry what tells them apart.** A list of rows each offering "Dismiss" gives a
  screen-reader User no way to know which. The visible label stays the name; the message is attached
  with `aria-describedby`.
- **A control carries its own state in ARIA**: a rejected input is `aria-invalid` and points at its
  message with `aria-describedby`; a control waiting on a request is `aria-busy`. Visual styling and
  a disabled attribute say nothing to a screen reader (WCAG 2.2 AA, 4.1.2).
- **Both Themes meet it.** A surface passes in `standard` and `dark-fantasy` or it does not pass.

Which diffs earn the axis is decided by `.claude/bin/review-context.sh`, not restated here.
