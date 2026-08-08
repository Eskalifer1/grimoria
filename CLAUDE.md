This file loads into every session's context — keep it short. Open a linked doc only when its
trigger applies to the current task.

## Stack

Next.js (App Router) with **Payload CMS 3 embedded** — no separate backend or deployable —
Postgres on Neon, one project with no monorepo, `next-intl` for the locale × theme copy system
from day one, Tailwind v4 + shadcn/ui, and a custom gated `/admin/*` rather than Payload's
built-in admin UI.

## Tooling

**Biome** is the single formatter and linter — no ESLint, no Prettier. Import order is an assist
action rather than formatting, so `yarn check` is the honest check and `yarn check:fix` the
honest fix. CI runs `yarn ci`.

**Yarn 4**, pinned by `packageManager` plus a committed release in `.yarn/releases` — no
Corepack; `yarnPath` in `.yarnrc.yml` is what resolves `yarn` to 4.x. `nodeLinker: node-modules`,
because Next.js and Payload do not expect Plug'n'Play. Yarn quarantines npm releases from the
last few days: on `all versions ... are quarantined`, take the newest version that resolves
rather than disabling the gate.

## Keep docs current

Run `/docs-sync` once a conversation settles something worth documenting — a decision, a term, a
feature behavior — and again before calling done any session that changed behavior, architecture
or scope. Drift is a bug; "I'll remember to update the doc" is not a plan.

A `PreToolUse` hook denies a commit staging non-doc changes with no corresponding doc touch. The
denial is the signal to run `/docs-sync`, not to bypass it.

## Where to look, by task

- **Creating a file under `src/`, or deciding where code belongs** — layers, naming, imports:
  `docs/agents/coding-standards/general.md`. Layer rules are lint-enforced, so guessing fails
  `yarn check`.
- **Writing a type**: `docs/agents/coding-standards/typescript.md`. `any`, `as`, `!` and
  `@ts-ignore` have one legal use each; object shapes are `interface`, state is a discriminated
  union closed by `assertNever`, domain shapes derive from `payload-types.ts`.
- **Building a React component** — server/client boundary, state, splitting, loading and error
  states: `docs/agents/coding-standards/components.md`. `views/` never carries `"use client"`, a
  server module carries `server-only`, and JSX conditionals close on `null`.
- **Writing styles** — utilities, tokens, shadcn primitives, variants:
  `docs/agents/coding-standards/styling.md`. Values outside the tokens do not compile, spacing is
  Tailwind's own scale, and a component never branches on the active Theme.
- **Writing a user-visible string, or editing `messages/`**:
  `docs/agents/coding-standards/i18n.md`. Copy is never hardcoded in JSX
  (`style/noJsxLiterals`), and a string is written in both theme catalogs in one change or `tsc`
  fails.
- **Designing or styling a UI surface**: `design/standard-design.md` and
  `design/dark-fantasy-design.md` — the written look of each Theme, fixing no values. Structure
  (shells, sidebar, masthead) is shared by both and lives in `docs/features/site-layout.md`.
- **Needing a concrete colour, radius, shadow or duration**: `src/styles/standard.css` and
  `dark-fantasy.css` — the only place values exist.
- **Changing a token value, or wondering why one is what it is**: `design/standard-tokens.md`
  and `design/dark-fantasy-tokens.md` — contrast fixes, accent-role rules, font weights, type
  scales, what is unsettled. Read before retuning a value.
- **Adding or renaming a design token**: `design/token-contract.md`. A token is added to both
  Themes in one change or not at all; a component that branches on the Theme means the contract
  is missing a name.
- **Needing the brand mark**: `design/logo.md` — one shared skeleton, two executions.
- **Building or updating a feature**: create/update `docs/features/<slug>.md` **as it is built**,
  never speculatively ahead of time.
- **Exploring the codebase or checking prior decisions**: `docs/agents/domain.md` (how to consume
  `CONTEXT.md` and `docs/adr/`).
- **Working with GitHub issues or PRs**: `docs/agents/issue-tracker.md`; which labels an issue
  gets: `docs/agents/labels.md`.
- **Branching, committing (the user commits, the agent proposes a title), closing an issue**:
  `docs/git-workflow.md`.
- **Writing or running tests, or touching CI**: `docs/testing.md`.
- **Triaging a Dependabot PR**: `docs/dependency-updates.md`.
- **Scoping a new review skill**: `docs/agents/review-skills-roadmap.md`.
