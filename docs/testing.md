# Testing

Which layer of test a piece of code gets, and what is not tested at all. Where test files live and
how they are named is `docs/agents/coding-standards/naming.md` → Tests. How a good test is written —
seams, anti-patterns, the red-green loop — is `/mattpocock-skills:tdd`.

## The four layers

Each layer is a Vitest project in `vitest.config.ts`, except e2e, which is a separate runner.

| Layer | Subject | Environment | File |
| --- | --- | --- | --- |
| `unit` | A pure function — no DOM, no database, no `next/headers` | node | `tests/**/*.test.ts` |
| `component` | A React component's rendered output and its response to interaction | jsdom + React Testing Library | `tests/**/*.test.tsx` |
| `integration` | Several real pieces together: Payload's Local API against real Postgres | node | `tests/**/*.integration.test.ts` |
| e2e | A journey through the running app in a real browser, in both Themes | Playwright | `e2e/` |

**Push a test down to the cheapest layer that still exercises the logic.** Where impure code wraps a
decision worth testing, extract the decision — `resolveTheme()` reads cookies and Payload, while the
`toTheme()` it delegates to is pure and unit-tested.

**Payload access control (`Role`, `Visibility`) runs against real Postgres and is never mocked** —
the pattern is #38, and the `integration` project is declared and empty until it lands.

**A Server Action is tested at the `unit` layer with its seams mocked** — `@/api/core/session`,
`@/api/core/payloadClient` and `next/cache`. `vitest.config.ts` aliases `server-only` to its empty
build, or importing the action throws before a test runs.

**The `component` project runs through the React Compiler**, as `next build` does, so a test asserts
what ships rather than the source it was written from.

**An async Server Component cannot be rendered by React Testing Library.** Its behavior is covered
by e2e (#39); the pure functions it calls are covered by unit.

## What is not tested

- **The vendored zone** — `src/shared/components/ui/**` is shadcn's code (`layers.md`).
- **Config and constants** — `next.config.ts`, `src/constants/**`, and anything with no branch.
- **Plain re-exports and one-line wrappers** around a library, such as `cn()`.

## Running

`yarn test` runs every project once and exits — this is what CI (#42) and `/checks` call.

**A file written under `src/` runs its covering test as it is written**, from the `PostToolUse` hook
(`CLAUDE.md`, `## Tooling`). A break surfaces at the file that caused it rather than at the handoff
gate, so writing an implementation file is followed by no `yarn test` of its own.

**Component tests render through `tests/setup/render.tsx`**, which wraps the providers a client
component needs.

## Test-first

The seams are agreed with the user before the first test is written, and the spec produced in
session 1 of `/task-flow` is where they are recorded.

## CI required checks

Once #42 lands, on every PR: install → `yarn ci` → `yarn typecheck` → `yarn spellcheck` (cspell) → `yarn test` →
`yarn build`, all required. Playwright e2e runs as an advisory (non-blocking) job until its coverage
stabilizes. The workflow itself is #42.

Coverage thresholds are deliberately absent (#28).
