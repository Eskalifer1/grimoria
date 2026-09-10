# Comments and documentation

What a comment carries, and what a JSDoc block adds to a signature. How a component documents its
props is `components.md`.

**A comment answers _why_** — the reason behind a choice, the constraint that forced it, the cost of
changing it. **Two lines, and three is the exception that has earned it.** A comment grown into a
paragraph is a decision, and decisions live in `docs/adr/` or a feature doc; the comment then
carries one line and the doc's path. **A fourth line is refused as a file is written** — Biome has
no such rule, so `.claude/hooks/long-comment.awk` counts the run and the `PostToolUse` hook hands it
back (`CLAUDE.md` → `## Tooling`). JSDoc is exempt, being the export's contract, and is still read
against the rest of this file. Where code needs a comment to be followed at all, rename the
thing or split the function instead.

**Deferred work is a GitHub issue**, and the code carries a comment naming the number that ends it.
A `TODO` is that issue not written: invisible to the board, immortal, silent about who decided what.
Superseded code is deleted — `git log` is the archive.

**JSDoc on every export**, and nowhere else — the same boundary that carries the explicit return
type. What leaves the module is read by people who will not open the file; local helpers are read
with their one caller. It carries **what the signature does not**: the format or unit of a value
(ISO date string, minutes, cents); behavior at the edges (empty input, missing record, out of
range); side effects (a cookie written, a path revalidated); what it throws and when; why the
function exists, when nobody would guess.

Tags stay minimal: `@param` and `@returns` only, no types inside them, and a parameter whose name
says everything is left out entirely. `src/shared/lib/assertNever.ts` and
`src/i18n/resolveTheme.ts` are
the shape to copy. This also covers `tests/setup/` and `tests/fixtures/`, which many specs import;
a spec documents itself through its titles.

A component is not a function here — its contract is its props interface (`components.md`).
