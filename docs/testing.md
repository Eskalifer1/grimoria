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
| e2e | A journey through the running app in a real browser, in both Themes | Playwright + Chromium | `e2e/**/*.spec.ts` |

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
build, or importing the action throws before a test runs. It aliases `next/font/google` to
`tests/fixtures/nextFont.ts` for the same reason — the loaders only run inside Next's bundler, so
anything importing a root layout throws with `Plus_Jakarta_Sans is not a function`.

**An async Server Component cannot be rendered by React Testing Library.** Its behavior is covered
by e2e; the pure functions it calls are covered by unit.

## What is not tested

- **`src/shared/components/ui/**`** — the registry's own code, ours to edit but not to cover (`layers.md`).
- **Config and constants** — `next.config.ts`, `src/constants/**`, and anything with no branch.
  `src/constants/env.ts` and `securityHeaders.ts` are the exceptions: one parses and defaults, the
  other branches on scope and environment, so both are tested.
- **Plain re-exports and one-line wrappers** around a library.

## Structural tests

**A rule about which files exist, what they import or what they must contain is a `unit` test over
`tests/fixtures/sourceTree.ts`**, beside the code it guards — `tests/app/pageRoutes.test.ts` ties
every `(site)` page to a `FRONTEND_ROUTES` entry, `tests/constants/envBoundary.test.ts` fences the
raw env. It is the fallback for a step a type cannot see; the standard it holds is
`docs/agents/coding-standards/abstraction.md`.

## Running

`yarn test` is what CI (#42) and `/checks` call; it is Vitest only — e2e is its own script, below.

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

## e2e

**`yarn test:e2e` runs Playwright against the production build**; `yarn test:e2e:ui` opens the same in
UI mode. Neither is part of `yarn test` or `/checks`; `/implement-issue` runs them once at its
handoff through `.claude/bin/gate.sh <n> e2e`, after the adversarial round and the docs pass. With
nothing answering on the database port that stage prints `e2e: SKIP` and the gate stays green — a
missing Docker is not a fact about the branch. `playwright.config.ts` is the runner: Chromium
only, `e2e/` as the test dir, trace on first retry, and `CI` deciding retries (`2` / `0`),
`forbidOnly` and whether a server already on the e2e port is reused (outside CI it is). The port is
`PORT` in `.env.e2e` — its own, not `3000`, so a `next dev` on Neon is never the server the run
lands on; `baseURL` and `BETTER_AUTH_URL` derive from it.

**The database is a throwaway Postgres from `docker-compose.yml`** — `docker compose up -d` once,
host port `5433` so a Postgres already on `5432` keeps its port. `.env.e2e` is committed and points
at it; every value in it is throwaway. The config reads that file with `parseEnv` and spreads it
*over* the shell's environment into `webServer.env`, so neither a Neon secret nor an exported
`DATABASE_URL` reaches the run. `DATABASE_URL_UNPOOLED` is set there too — `src/constants/env.ts`
prefers it for schema work, and the local `.env`'s Neon value would otherwise take `payload migrate`.
The `webServer` command is `yarn build:migrate && yarn start`; in CI (#42) the job builds in its own
step and the command only migrates and starts.

**The seam is HTTP.** A spec drives the page a Guest sees and reads what the browser rendered; the
only app code it imports is `src/constants/theme.ts` and the `messages/` catalogs, both data. Any
pure decision a journey exposes belongs in Vitest, not here.

`e2e/theme.spec.ts` is the one journey: start with no cookie and assert `standard`; for every other
Theme, check its radio by the catalog label the *current* Theme shows, assert, reload, assert again,
switch back and assert. Per Theme it asserts `html[data-theme]`, the computed `body` background
against `THEME_COLOR`, the `h1` against that catalog's `homePage.title`, and the checked radio — so a
copy or token change moves the test with it. Signed-in journeys, the setup project and
`storageState` are #119.

**A local Postgres of your own works too** when Docker is absent: any instance on `5433` with the
role, password and database `.env.e2e` names.

## Test-first

The seams are agreed with the user before the first test is written, and the spec produced in
session 1 of `/task-flow` is where they are recorded.

## CI required checks

No workflow exists yet. **#42 is canonical** for which checks a PR requires and which are advisory.

Coverage thresholds are deliberately absent (#28).
