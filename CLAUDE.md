This file loads into every session's context — keep it short. Open a linked doc only when its
trigger applies to the current task.

## Stack

Next.js (App Router) with **Payload CMS 3 embedded** — no separate backend or deployable — Postgres
on Neon, `next-intl` for the locale × theme copy system, Tailwind v4 + shadcn/ui, Better Auth for
authentication. Payload's admin at `/cms` is the only admin, for the maintainer alone.

## Tooling

**Biome** is the single formatter and linter — `yarn check`, `yarn check:fix`. CI runs `yarn ci`.

**Yarn 4**, `nodeLinker: node-modules`. On `all versions ... are quarantined`, take the newest
version that resolves rather than disabling the gate.

**American English everywhere it is written down or posting on GH**, `yarn spellcheck` guards it. Local discussion is
the exception.

## Keep docs current

Run `/docs-sync` once a conversation settles something worth documenting, and again before calling
done any session that changed behavior, architecture or scope. Drift is a bug. `/implement-issue`
runs it at step 12, before the commit is handed over; outside that flow nothing prompts for it.

## Where to look, by task

All paths below are from the repo root. `<standards>` is `docs/agents/coding-standards/`.

- **Creating a file under `src/`, or deciding where code belongs** — layers, folders, file names,
  imports, comments: `<standards>/layers.md` (lint-enforced), `routing.md`, `naming.md`,
  `imports.md`, `documentation.md`.
- **Writing a type, or reaching for `any`, `as`, `!`, `@ts-ignore`**: `<standards>/typescript.md`.
  Domain shapes derive from `payload-types.ts`.
- **Building a React component** — server/client boundary, state, splitting, loading and error
  states: `<standards>/components.md`.
- **Writing styles** — utilities, tokens, shadcn primitives, variants: `<standards>/styling.md`.
  Values outside the tokens do not compile.
- **Writing a user-visible string, or editing `messages/`**: `<standards>/i18n.md`. Copy is never
  hardcoded in JSX, and a string is written in both theme catalogs or `tsc` fails.
- **Needing a fixed value — theme, route, cookie name, duration, limit**: `src/constants/`, one file
  per subject; a route is `ROUTES` in `constants/routes.ts`. Naming is `<standards>/naming.md`.
- **Designing or styling a UI surface**: `design/standard-design.md`,
  `design/dark-fantasy-design.md`; shared structure in `docs/features/site-layout.md`.
- **Needing a concrete color, radius, shadow or duration**: `src/styles/standard.css` and
  `dark-fantasy.css`.
- **Changing a token value, or asking why one is what it is**: `design/standard-tokens.md`,
  `design/dark-fantasy-tokens.md`.
- **Adding or renaming a design token**: `design/token-contract.md`. Both Themes in one change.
- **Sign-in, sign-up, sessions, `Role`, or who may reach `/cms`**: `docs/features/auth.md`.
- **Building or updating a feature**: create/update `docs/features/<slug>.md` **as it is built**.
- **Exploring the codebase or checking prior decisions**: `docs/agents/domain.md`.
- **Starting work on a tracker issue, unsure which mode it needs** — breaking down an epic,
  grilling one into a spec, picking the next ready child: `/task-flow <issue>`.
- **Implementing a `ready-for-agent` issue** — branch, test-first, gates, review, handoff:
  `/implement-issue <issue>`.
- **Checking where a branch stands — lint, types, spelling, tests, build**: `/checks` for the fast
  three, `/checks full` to add `yarn test` and `yarn build`.
- **Working with GitHub issues or PRs**: `docs/agents/issue-tracker.md`; labels:
  `docs/agents/labels.md`.
- **Creating a branch for a task, or naming one**: `docs/git-branching.md`.
- **Committing, commit messages, closing an issue**: `docs/git-workflow.md`. The user commits,
  never you.
- **Writing or running tests, choosing a test layer, or touching CI**: `docs/testing.md`.
- **Reviewing a diff, or judging whether a review finding is legitimate**:
  `<standards>/review-boundaries.md`.
- **Triaging a Dependabot PR**: `docs/dependency-updates.md`.
