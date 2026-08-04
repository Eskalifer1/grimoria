This file loads into every session's context — keep it short. Details live in the linked docs below; open a doc only when its trigger condition applies to the current task.

## Stack

Next.js (App Router) with Payload CMS 3 embedded (no separate backend or deployable — ADR-0005), Postgres on Neon, single Next.js project with no monorepo/workspaces (ADR-0006), `next-intl` for the locale × theme copy system from day one (ADR-0004), Tailwind CSS v4 + shadcn/ui for styling, custom gated `/admin/*` (ADR-0001) rather than Payload's built-in admin UI. Reasoning for each: `docs/adr/`.

## Package manager

Yarn.

## Keep docs current

Run `/docs-sync` right after a conversation settles something worth documenting (a decision, a term, a feature behavior), and again before considering any session that changed behavior, architecture, or scope done. Documentation drift is treated as a bug — "I'll remember to update the doc" is not a plan.

A `PreToolUse` hook on `git commit` denies a commit that stages non-doc changes with no corresponding doc touch, listing the unaccounted-for files. The denial is the signal to run `/docs-sync` before retrying, not to bypass it.

## Where to look, by task

- **Creating, reading, listing, commenting on, closing, or labeling GitHub issues/PRs**: `docs/agents/issue-tracker.md`
- **Deciding which labels an issue gets**: `docs/agents/labels.md`
- **Exploring the codebase, using domain vocabulary, or checking prior decisions**: `docs/agents/domain.md` (how to consume `CONTEXT.md` and `docs/adr/`)
- **Building or updating a feature**: create/update `docs/features/<slug>.md` as it's actually built, not speculatively ahead of time
- **Writing or running tests, or touching CI config**: `docs/testing.md`
- **Creating a branch or a commit**: `docs/git-workflow.md`
- **Scoping a new review skill for this project**: `docs/agents/review-skills-roadmap.md`
