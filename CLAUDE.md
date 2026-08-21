Open a linked doc only when its trigger applies to the current task.

## Stack

Next.js (App Router) with **Payload CMS 3 embedded** — no separate backend or deployable — Postgres
on Neon, `next-intl` for the locale × theme copy system, Tailwind v4 + shadcn/ui, Better Auth for
authentication. Payload's admin at `/cms` is the only admin, for the maintainer alone.

## Tooling

**Biome** is the single formatter and linter — `yarn check`, `yarn check:fix`. CI runs `yarn ci`.

**A file written with `Write` or `Edit` comes back formatted, spell-checked and tested** — a
`PostToolUse` hook (`.claude/hooks/gate-written-file.sh`) runs Biome and cspell on it, the covering
test when it sits under `src/`, and `git add -N` when it is new. Fix what it hands back; silence
means green. **A file created any other way — a heredoc, a generator — gets none of that** and needs
`yarn check --write` and `git add -N` by hand.

**Yarn 4**, `nodeLinker: node-modules`. On `all versions ... are quarantined`, take the newest
version that resolves rather than disabling the gate.

**American English in everything written down or posted to GitHub**, guarded by `yarn spellcheck`.
Local discussion is the exception.

## Keep docs current

Run `/docs-sync` once a conversation settles something worth documenting, and again before calling
done any session that changed behavior, architecture or scope — drift is a bug. `/implement-issue`
runs it at its handoff; nothing else prompts for it.

## Where to look, by task

All paths below are from the repo root. `<standards>` is `docs/agents/coding-standards/`.

- **Creating a file under `src/`, or deciding where code belongs** — layers, folders, file names,
  imports, comments: `<standards>/layers.md` (lint-enforced), `routing.md`, `naming.md`,
  `imports.md`, `documentation.md`.
- **Writing a type, or reaching for `any`, `as`, `!`, `@ts-ignore`**: `<standards>/typescript.md`.
- **Building a React component** — server/client boundary, state, splitting, loading and error
  states: `<standards>/components.md`.
- **Writing styles** — utilities, tokens, shadcn primitives, variants: `<standards>/styling.md`.
  Values outside the tokens do not compile.
- **Writing a user-visible string, or editing `messages/`**: `<standards>/i18n.md`.
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
- **Exploring the codebase or checking prior decisions**: `docs/agents/domain.md`.
- **Starting work on a tracker issue, unsure which mode it needs** — breaking down an epic,
  grilling one into a spec, picking the next ready child: `/task-flow <issue>`.
- **Implementing a `ready-for-agent` issue** — branch, test-first, gates, review, handoff:
  `/implement-issue <issue>`.
- **Making a change whose blast radius is already known** — a mechanical sweep across many files, a
  rename, a copy fix, a config bump: `/implement-issue-simple [issue]`, which branches, codes, gates
  and proposes a title with no slices and no judging round.
- **Checking where a branch stands — lint, types, spelling, tests, build**: `/checks` runs the full
  gate, `/checks fast` drops `yarn build` and keeps the rest.
- **Judging a branch someone else wrote** — gates, a requirement unmet, met differently or met more
  widely than asked, the review axes the diff earns, the acceptance criteria:
  `/verify-branch <issue> <full|recheck>`.
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
- **Keyboard reach, screen-reader names, focus order, ARIA state, or what a11y level we hold**:
  `<standards>/accessibility.md`; to review a branch against it, `/a11y-review [range]`.
- **Writing a collection's access control, a route handler, a Server Action, or anything reading
  User input** — who may do what: `docs/features/auth.md`; to review a branch for access holes,
  IDOR, unvalidated input, racing writes, leaked secrets or injection:
  `/payload-security-review [range]`.
- **Hunting a latent correctness bug on a branch** — an edge input, a floating `Promise`, a
  swallowed failure, state that disagrees with itself, `as` or `!` standing in for a check, the
  server/client boundary, cache and revalidation, Payload hook ordering: `/bug-hunt-review [range]`.
- **Triaging a Dependabot PR**: `docs/dependency-updates.md`.
