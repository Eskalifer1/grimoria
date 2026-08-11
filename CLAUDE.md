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
done any session that changed behavior, architecture or scope. Drift is a bug. A `PreToolUse` hook
denies a commit that stages code with no doc touch; that denial is the signal to run `/docs-sync`.

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
- **Working with GitHub issues or PRs**: `docs/agents/issue-tracker.md`; labels:
  `docs/agents/labels.md`.
- **Branching, committing, closing an issue**: `docs/git-workflow.md`. The user commits, never you.
- **Writing or running tests, or touching CI**: `docs/testing.md`.
- **Triaging a Dependabot PR**: `docs/dependency-updates.md`.
- **Scoping a new review skill**: `docs/agents/review-skills-roadmap.md`.
