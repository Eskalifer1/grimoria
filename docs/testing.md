# Testing

Vitest + React Testing Library for unit/component tests. Playwright for e2e, including both themes.

Payload access-control logic (`Role`, `Visibility`) is tested against a real Postgres instance, never mocked — that's the highest-value code to get right.

## CI required checks

On every PR: install → `biome check` → `tsc --noEmit` → `yarn spellcheck` (cspell) → Vitest → `next build`, all required. Playwright e2e runs as an advisory (non-blocking) job until its coverage stabilizes.
