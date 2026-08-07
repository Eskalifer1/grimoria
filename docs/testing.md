# Testing

Vitest + React Testing Library for unit/component tests. Playwright for e2e, including both themes.

Payload access-control logic (`Role`, `Visibility`) is tested against a real Postgres instance, never mocked — that's the highest-value code to get right.

Where test files live — the `tests/` tree mirroring `src/`, `e2e/` for Playwright, and how they're named — is settled in `docs/agents/coding-standards/general.md` §9, not here.

## CI required checks

On every PR: install → `yarn ci` (`biome ci` — formatting, lint and import order, never writing to disk) → `yarn typecheck` → `yarn spellcheck` (cspell) → Vitest → `next build`, all required. Playwright e2e runs as an advisory (non-blocking) job until its coverage stabilizes.
