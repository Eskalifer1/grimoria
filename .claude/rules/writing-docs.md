---
paths:
  - "docs/**/*.md"
  - "design/**/*.md"
---

# Writing a doc here

These docs are loaded on demand, so length is a cost paid per task. Write what the code cannot say,
once, and stop.

- **Judgment over rules.** State the constraint and the reason; reserve "always" and "never" for a
  failure mode that has actually been observed. The reader can read the surrounding code and match
  it.
- **Self-describing over demonstrated.** An example that restates the sentence above it is cut.
  Keep one only for a form nobody would guess — a required wording, an exact idiom. Prefer a
  precise name or an enum over an example showing how to use it.
- **A reference, not thin instructions.** One doc per question, opened by its own trigger. Depth is
  fine behind a pointer; split rather than summarize.
- **CLAUDE.md is not the warehouse.** It carries shared conventions and pointers. Personal or
  session context belongs in memory, everything else in the doc its trigger opens.
- **Every added line is a conflict to resolve.** A rule stated in two docs has two places to drift:
  leave it in one and a pointer in the other. A doc that disagrees with a rule file or with
  CLAUDE.md costs more than the sentence was worth.

Cut on sight: a negation that restates the positive clause ("the single linter — no ESLint"); a
sentence naming neither a rule nor a reason; a value already readable in the file the doc points
at; and the story of how the current state came about, which is `git log` and `docs/adr/`.
