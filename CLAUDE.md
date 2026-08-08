This file loads into every session's context — keep it short. Details live in the linked docs below; open a doc only when its trigger condition applies to the current task.

## Stack

Next.js (App Router) with Payload CMS 3 embedded (no separate backend or deployable — ADR-0005), Postgres on Neon, single Next.js project with no monorepo/workspaces (ADR-0006), `next-intl` for the locale × theme copy system from day one (ADR-0004), Tailwind CSS v4 + shadcn/ui for styling, custom gated `/admin/*` (ADR-0001) rather than Payload's built-in admin UI. Reasoning for each: `docs/adr/`.

## Formatting & linting

Biome is the single formatter and linter (no ESLint, no Prettier) — `biome.json`.
Import order is an assist action, not formatting: `yarn check` is the honest
check, `yarn check:fix` the honest fix. CI runs `yarn ci`.

## Package manager

Yarn 4, pinned by `packageManager` + a committed release in `.yarn/releases` (no Corepack — `yarnPath` in `.yarnrc.yml` is what resolves `yarn` to 4.x). `nodeLinker: node-modules`, because Next.js and Payload don't expect Plug'n'Play.

Yarn quarantines npm releases from the last few days. On `all versions ... are quarantined`, take the newest version that resolves rather than disabling the gate.

## Keep docs current

Run `/docs-sync` right after a conversation settles something worth documenting (a decision, a term, a feature behavior), and again before considering any session that changed behavior, architecture, or scope done. Documentation drift is treated as a bug — "I'll remember to update the doc" is not a plan.

A `PreToolUse` hook on `git commit` denies a commit that stages non-doc changes with no corresponding doc touch, listing the unaccounted-for files. The denial is the signal to run `/docs-sync` before retrying, not to bypass it.

## Where to look, by task

- **Creating, reading, listing, commenting on, closing, or labeling GitHub issues/PRs**: `docs/agents/issue-tracker.md`
- **Deciding which labels an issue gets**: `docs/agents/labels.md`
- **Exploring the codebase, using domain vocabulary, or checking prior decisions**: `docs/agents/domain.md` (how to consume `CONTEXT.md` and `docs/adr/`)
- **Building or updating a feature**: create/update `docs/features/<slug>.md` as it's actually built, not speculatively ahead of time
- **Designing or styling any UI surface**: `design/standard-design.md` and `design/dark-fantasy-design.md` — the written look of each Theme. They fix no values; tokens are the design system's output, not these docs'. Structure (shells, sidebar, masthead) is not in them — it is shared by both Themes and lives in `docs/features/site-layout.md`
- **Needing a concrete colour, font, or weight**: `design/standard-tokens.md` and `design/dark-fantasy-tokens.md` — the values, in the form implementation consumes
- **Needing the brand mark**: `design/logo.md` — one shared skeleton, two executions. The
  interface never sets the product name as type; the sidebar carries the mark alone
- **Adding or renaming a design token**: `design/token-contract.md` — the semantic names both Themes fill. A token is added to both value docs in the same change, or not at all; a component that branches on the active Theme means the contract is missing a name
- **Creating any file under `src/`, or deciding where code belongs** — layers, folder/file naming, imports: `docs/agents/coding-standards/general.md`. The layer rules are lint-enforced (`biome.json` → `overrides`), so guessing fails `yarn check`
- **Writing any type — props, domain shapes, unions, generics**: `docs/agents/coding-standards/typescript.md`. `any`, `as`, `!` and `@ts-ignore` each have one legal use and no other; object shapes are `interface`, state is a discriminated union closed by `assertNever`, and domain shapes are derived from `payload-types.ts`. Most of it is lint-enforced, so guessing fails `yarn check`
- **Writing any user-visible string, or editing `messages/`**: `docs/agents/coding-standards/i18n.md` — keys, namespaces, ICU, and how to write the dark-fantasy tonality. Copy never gets hardcoded in JSX (`style/noJsxLiterals`), and a string is written in both theme catalogs in the same change or `tsc` fails
- **Writing or running tests, or touching CI config**: `docs/testing.md`
- **Changing how dependencies get updated, or triaging a Dependabot PR**: `docs/dependency-updates.md`
- **Creating a branch, committing (user commits, agent proposes the title), or closing an issue after commit**: `docs/git-workflow.md`
- **Scoping a new review skill for this project**: `docs/agents/review-skills-roadmap.md`
