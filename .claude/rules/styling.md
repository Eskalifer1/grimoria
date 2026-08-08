---
paths:
  - "src/**/*.css"
---

# Editing a stylesheet here

**Read `docs/agents/coding-standards/styling.md` before changing values here.** It holds the
utility rules, the vendored zone, and which file holds what. This file is a reminder, not a
substitute.

Four things the build stays silent about:

- **Both Themes, one change.** A name added to `standard.css` is added to `dark-fantasy.css` in
  the same edit. `none` or `0` is a value; a missing declaration is drift, and it shows up only
  once someone switches Theme.
- **A dropped namespace stays dropped.** `--color-*: initial` and its siblings in `tokens.css`
  are the whole reason `bg-red-500` fails. Restoring one to reach a value trades the guarantee
  for that value — the fix is a contract name.
- **`@theme inline` is what follows the active Theme.** A contract name declared in plain
  `@theme` resolves once at build time and freezes on `standard`.
- **The dark-fantasy selector keeps its `:root`.** A bare `[data-theme=…]` carries the same
  specificity, which hands the winner to import order.
