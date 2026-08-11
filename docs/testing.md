# Testing

Vitest + React Testing Library for unit/component tests. Playwright for e2e, including both themes.

Payload access-control logic (`Role`, `Visibility`) is tested against a real Postgres instance, never mocked.

Where test files live and how they're named is `docs/agents/coding-standards/naming.md` → Tests, not here.

## Test-first

Work runs red → green in **vertical slices**: one seam, one failing test, one implementation, next
slice. The seams are agreed with the user before the first test is written, and the spec produced in
session 1 of `/task-flow` is where they are recorded.

The loop itself is `/mattpocock-skills:tdd`. **It waits on #28** — there is no runner installed yet.

## CI required checks

On every PR: install → `yarn ci` → `yarn typecheck` → `yarn spellcheck` (cspell) → Vitest → `yarn build`, all required. Playwright e2e runs as an advisory (non-blocking) job until its coverage stabilizes.
