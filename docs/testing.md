# Testing

Which layer of test a piece of code gets, and what is not tested at all. Where test files live and
how they are named is `docs/agents/coding-standards/naming.md` → Tests. How a good test is written —
seams, anti-patterns, the red-green loop — is `/mattpocock-skills:tdd`.

## The three layers

Each layer is a Vitest project in `vitest.config.ts`, except e2e, which is a separate runner.

| Layer | Subject | Environment | File |
| --- | --- | --- | --- |
| `unit` | A pure function — no DOM, no database, no `next/headers` | node | `tests/**/*.test.ts` |
| `component` | A React component's rendered output and its response to interaction | jsdom + React Testing Library | `tests/**/*.test.tsx` |
| e2e | A journey through the running app in a real browser, in both Themes | Playwright | `e2e/` — not built, #39 |

**Push a test down to the cheapest layer that still exercises the logic.** Where impure code wraps a
decision worth testing, extract the decision — `sessionCookiesPlugin` can only run inside Better
Auth, while the `sessionCookiesFor()` it delegates to takes an outcome and returns cookies, and is
unit-tested.

**No test reaches a database.** Every seam that would — `@/api/core/payloadClient`,
`@/api/core/session` — is mocked, and a test that creates, updates or deletes a real row does not
belong in this repo whatever it is guarding. Payload access control (`Role`, `Visibility`) is
therefore held by review and by e2e against the running app, not by a suite of its own; #38, which
planned that suite, is closed not-planned.

**A Server Action is tested at the `unit` layer with its seams mocked** — `@/api/core/session`,
`@/api/core/payloadClient` and `next/cache`. `vitest.config.ts` aliases `server-only` to its empty
build, or importing the action throws before a test runs.

**An async Server Component cannot be rendered by React Testing Library.** Its behavior is covered
by e2e (#39); the pure functions it calls are covered by unit.

## What is not tested

- **`src/shared/components/ui/**`** — the registry's own code, ours to edit but not to cover (`layers.md`).
- **Config and constants** — `next.config.ts`, `src/constants/**`, and anything with no branch.
  `src/constants/env.ts` and `securityHeaders.ts` are the exceptions: one parses and defaults, the
  other branches on scope and environment, so both are tested.
- **Plain re-exports and one-line wrappers** around a library, such as `cn()`.

## Running

`yarn test` is what CI (#42) and `/checks` call.

**A file written under `src/` runs its covering test as it is written** — the `PostToolUse` hook,
`CLAUDE.md` → `## Tooling`.

**Component tests render through `tests/setup/render.tsx`**, which wraps the providers a client
component needs. `tests/setup/component.ts` installs a `matchMedia` stand-in that matches nothing — the toaster asks
it for `prefers-reduced-motion` on mount and throws without one, and what the preference changes is
a browser fact rather than a jsdom one. It installs a `localStorage` stand-in too, because this jsdom
build ships none and without it anything reading it runs memory-only — a suite asserting that
something survives a reload would pass without ever touching the slot.

**A value that is both shown and edited is asserted in both places.** A test that reads the rendered
text alone goes green while the control beside it holds something else.

## Test-first

The seams are agreed with the user before the first test is written, and the spec produced in
session 1 of `/task-flow` is where they are recorded.

## CI required checks

No workflow exists yet. **#42 is canonical** for which checks a PR requires and which are advisory.

Coverage thresholds are deliberately absent (#28).
