Open a linked doc only when its trigger applies to the current task.

## Stack

Next.js (App Router) with **Payload CMS 3 embedded** — no separate backend or deployable — Postgres
on Neon, `next-intl` for the locale × theme copy system, Tailwind v4 + shadcn/ui, Better Auth for
authentication. Payload's admin at `/cms` is the only admin, for the maintainer alone.

## Tooling

**Biome** is the single formatter and linter. **A file written with `Write` or `Edit` comes back
through `.claude/hooks/gate-written-file.sh`** — Biome, cspell, the covering test under `src/`,
`git add -N` when new, and a refusal of any comment run over three lines outside JSDoc. Fix what it
hands back; silence means green. **A file created any other way — a heredoc, a generator — gets
none of that** and needs `yarn check --write` and `git add -N` by hand.

**Yarn 4**, `nodeLinker: node-modules`. On `all versions ... are quarantined`, take the newest
version that resolves rather than disabling the gate.

## Which language to write in

**Talk to the User in Ukrainian** — every reply, in any skill, including a flow's questions and
its handoff report, whatever language the User last typed in. **Write American English in
everything that outlives the session** — code, comments, docs, commits, anything posted to GitHub —
guarded by `yarn spellcheck`. A path, a symbol, a command and a quoted gate output stay verbatim
inside a Ukrainian sentence.

## Keep docs current

A feature gets `docs/features/<slug>.md` **as it is built**. Run `/docs-sync` once a conversation
settles something worth documenting, and before calling done any session that changed behavior,
architecture or scope; `/implement-issue` runs it at its handoff, nothing else prompts for it.
Run `/learn` in the same turn as a correction to how code is written, and **report its judgment
either way** — recorded in `<standards>/*.md`, or left local and why.

## Where to look, by task

`<standards>` is `docs/agents/coding-standards/`. `src/api/`, `src/collections/`,
`src/app/(frontend)/`, `messages/`, component folders and stylesheets are routed by
`.claude/rules/` on edit instead.

- **Creating a file under `src/`, or deciding where code belongs** — layers, folders, file names,
  imports, comments: `<standards>/layers.md` (lint-enforced), `<standards>/routing.md`,
  `<standards>/naming.md`, `<standards>/imports.md`, `<standards>/documentation.md`.
- **Writing a type, or reaching for `any`, `as`, `!`, `@ts-ignore`**: `<standards>/typescript.md`.
- **Writing something a second caller will reuse, repeating a check, or typing a bare string a
  constant should hold** — wrappers, result unions, shared error codes: `<standards>/abstraction.md`.
- **Needing a fixed value — theme, route, cookie name, duration, limit**: `src/constants/`, one file
  per subject; a route is `ROUTES` in `constants/routes.ts`.
- **Reading data or writing it back** — where a Payload query lives, what a Server Action returns,
  optimistic or blocking, rollback, cache tags, revalidation: `docs/features/data-access.md`.
- **Building a form, or deciding where a failure is said** — field, footer, blocked surface or
  toast: `docs/features/forms.md`; a bound control: `docs/features/forms/controls.md`.
- **Opening a modal, asking a question the User must answer, or confirming a delete**:
  `docs/features/modals.md`. **A loading indicator or a divider**: `docs/features/loader-and-rule.md`.
- **Designing or styling a UI surface**: `design/standard-design.md`, `design/dark-fantasy-design.md`,
  `docs/features/site-layout.md`; **adapting it to a viewport, touch target or safe area**:
  `<standards>/responsive.md`; **what a keyboard or screen-reader User is promised**:
  `<standards>/accessibility.md`.
- **Sign-in, sign-up, sessions, `Role`, who may reach `/cms`, or anything reading User input** —
  a route handler, a Server Action: `docs/features/auth.md`.
- **Writing or running tests, choosing a test layer, or touching CI**: `docs/testing.md`.
- **Exploring the codebase or checking prior decisions**: `docs/agents/domain.md`.
- **A GitHub issue, PR or label**: `docs/agents/issue-tracker.md`, `docs/agents/labels.md`;
  **a Dependabot PR**: `docs/dependency-updates.md`.
- **Naming a branch, committing, closing an issue**: `docs/git-branching.md`, `docs/git-workflow.md`.
  The user commits, never you.
