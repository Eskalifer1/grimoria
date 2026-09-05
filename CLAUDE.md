Open a linked doc only when its trigger applies to the current task.

## Stack

Next.js (App Router) with **Payload CMS 3 embedded** — no separate backend or deployable — Postgres
on Neon, `next-intl` for the locale × theme copy system, Tailwind v4 + shadcn/ui, Better Auth for
authentication. Payload's admin at `/cms` is the only admin, for the maintainer alone.

## Tooling

**Biome** is the single formatter and linter — `yarn check`, `yarn check:fix`. CI runs `yarn ci`.

**A file written with `Write` or `Edit` comes back formatted, spell-checked and tested** — a
`PostToolUse` hook (`.claude/hooks/gate-written-file.sh`) runs Biome and cspell on it, the covering
test when it sits under `src/`, and `git add -N` when it is new. **A `Write` that creates a doc gets
`.claude/rules/writing-docs.md` handed back** — the rules injection fires on `Edit` alone, so the
first draft is written without it. Fix what it hands back; silence means green. **A file created any other way — a heredoc, a generator — gets none of that** and needs
`yarn check --write` and `git add -N` by hand.

**Yarn 4**, `nodeLinker: node-modules`. On `all versions ... are quarantined`, take the newest
version that resolves rather than disabling the gate.

**American English in everything written down or posted to GitHub**, guarded by `yarn spellcheck`.
Local discussion is the exception.

## Keep docs current

Run `/docs-sync` once a conversation settles something worth documenting, and again before calling
done any session that changed behavior, architecture or scope — drift is a bug. `/implement-issue`
runs it at its handoff; nothing else prompts for it.

## A correction becomes a standard

Run `/learn` in the same turn as the fix, and **report its judgment either way** — recorded in
`<standards>/*.md`, or left local and why. A correction acted on and not written down is one the
next session repeats.

## Where to look, by task

`<standards>` is `docs/agents/coding-standards/`.

- **Creating a file under `src/`, or deciding where code belongs** — layers, folders, file names,
  imports, comments: `<standards>/layers.md` (lint-enforced), `<standards>/routing.md`,
  `<standards>/naming.md`, `<standards>/imports.md`, `<standards>/documentation.md`.
- **Writing a type, or reaching for `any`, `as`, `!`, `@ts-ignore`**: `<standards>/typescript.md`.
- **Writing something a second caller will reuse, repeating a check, or typing a bare string a
  constant should hold** — wrappers, result unions, shared error codes, documented options:
  `<standards>/abstraction.md`.
- **Building a React component** — server/client boundary, state, splitting, loading and error
  states: `<standards>/components.md`.
- **Writing styles** — utilities, tokens, shadcn primitives, variants: `<standards>/styling.md`.
  Values outside the tokens do not compile.
- **Writing a user-visible string, or editing `messages/`**: `<standards>/i18n.md`.
- **Building a form** — the `Form.*` primitives, `useOptimisticForm`/`useActionForm`, validation
  copy:
  `docs/features/forms.md`.
- **Needing a fixed value — theme, route, cookie name, duration, limit**: `src/constants/`, one file
  per subject; a route is `ROUTES` in `constants/routes.ts`.
- **Designing or styling a UI surface**: `design/standard-design.md`,
  `design/dark-fantasy-design.md`; shared structure in `docs/features/site-layout.md`.
- **Needing a concrete color, radius, shadow or duration**: `src/styles/standard.css` and
  `dark-fantasy.css`.
- **Changing a token value, or asking why one is what it is**: `design/standard-tokens.md`,
  `design/dark-fantasy-tokens.md`. **Adding or renaming one**: `design/token-contract.md`, both
  Themes in one change.
- **Sign-in, sign-up, sessions, `Role`, or who may reach `/cms`**: `docs/features/auth.md`.
- **Building or updating a feature**: create/update `docs/features/<slug>.md` **as it is built**.
- **Reading data or writing it back** — where a Payload query lives, what a Server Action returns,
  optimistic or blocking, rollback on failure, revalidation: `docs/features/data-access.md`, and
  `docs/features/data-access/api-local.md` for the `src/api/` layer and the action contract.
- **Exploring the codebase or checking prior decisions**: `docs/agents/domain.md`.
- **Working with GitHub issues or PRs**: `docs/agents/issue-tracker.md`; labels:
  `docs/agents/labels.md`.
- **Creating a branch for a task, or naming one**: `docs/git-branching.md`.
- **Committing, commit messages, closing an issue**: `docs/git-workflow.md`. The user commits,
  never you.
- **Changing a collection** — a field, collection, index or relationship added, removed or renamed:
  generate the migration in the same change. `docs/database-migrations.md` also covers proving a
  rollback and what the production deploy does on its own.
- **Writing or running tests, choosing a test layer, or touching CI**: `docs/testing.md`.
- **Reviewing a diff, or judging whether a review finding is legitimate**:
  `<standards>/review-boundaries.md`.
- **Accessibility — what a keyboard and screen-reader User is promised**, and reviewing a surface
  against it with `/a11y-review`: `<standards>/accessibility.md`.
- **Writing a collection's access control, a route handler, a Server Action, or anything reading
  User input** — who may do what: `docs/features/auth.md`.
- **Triaging a Dependabot PR**: `docs/dependency-updates.md`.
