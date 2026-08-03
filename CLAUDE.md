## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`Eskalifer1/grimoria`), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Labels

Every issue gets one `area`, one `type`, and one `priority` label (flat names on GitHub — `frontend`/`backend`/`design`/`infra`, `NewFeature`/`chore`/`research`/`decision`, `critical`/`priority`/`not-a-priority` — no `area:`/`type:`/`priority:` prefixes). Blocking relationships use GitHub's native issue dependencies, not a label. See `docs/agents/labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root (created lazily as decisions are made). See `docs/agents/domain.md`.

### Feature docs

Every feature gets its own `docs/features/<slug>.md` describing how it works and why it exists — not just GitHub issue bodies. Create/update it as the feature is actually built, not speculatively ahead of time.

## Conventions

### Keep docs current

Run `/docs-sync` right after a conversation settles something worth documenting (a decision, a term, a feature behavior), and again before considering any session that changed behavior, architecture, or scope done. It reads both the conversation and the diff since the default branch, proposes which of `CONTEXT.md`/`docs/adr/`, `docs/features/<slug>.md`, `docs/agents/*.md`, or this file need updating and why, and waits for confirmation before writing anything. `/implement` runs it as its last step, before the final commit. Documentation drift is treated as a bug — "I'll remember to update the doc" is not a plan, `/docs-sync` is.

As a safety net (not a replacement for actually running `/docs-sync`), a `PreToolUse` hook on `git commit` (`.claude/hooks/docs-sync-check.sh`, wired in `.claude/settings.json`) denies a commit that stages non-doc changes with zero `docs/`/`CONTEXT.md`/`CLAUDE.md` touch, listing exactly which staged files are unaccounted for — the denial is the signal to run `/docs-sync` before retrying. Advisory, not permanent: once the exact same staged content has been flagged and reviewed, it passes through on retry. It exists because a doc (`docs/agents/labels.md`) once went stale against real GitHub labels with nothing catching it before commit — though note the hook only sees `git`, so it can't catch that specific class of drift (state that changes outside git, like GitHub labels) by itself; that still relies on `/docs-sync` being invoked directly.

### Stack and architecture

See `docs/adr/` for the reasoning — this is just a pointer. Next.js (App Router) with Payload CMS 3 embedded (no separate backend app or deployable — ADR-0005), Postgres on Neon, single Next.js project with no monorepo/workspaces (ADR-0006), `next-intl` for the locale × theme copy system from day one (ADR-0004), Tailwind CSS v4 + shadcn/ui for styling, custom gated `/admin/*` (ADR-0001) rather than Payload's built-in admin UI.

### Package manager and TypeScript

Yarn. TypeScript 7 (native Go compiler, ships as plain `tsc`) with `strict`, `noUncheckedIndexedAccess`, and `noImplicitOverride` — adopted pending a verification spike confirming Payload's type generation and Next.js tooling work without TS 7's (currently missing) public Compiler API.

### Formatting, linting, spelling

Biome for formatting and linting (not Oxlint+Oxfmt — the latter's formatter is still alpha). cspell runs in CI only (not pre-commit) across code, docs, and UI copy resources, backed by a project-specific dictionary for invented dark-fantasy terms and technology names.

### Testing

Vitest + React Testing Library for unit/component tests, Playwright for e2e (including both themes). Payload access-control logic is tested against a real Postgres instance, never mocked — that's the highest-value code to get right (`Role`, `Visibility`).

### Git workflow and commits

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys continuously to Vercel production. Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, …). No pre-commit hooks currently — add them later if they prove necessary. Neon has two branches (`main`, `dev`), not one per PR.

### CI required checks

On every PR: install → `biome check` → `tsc --noEmit` → cspell → Vitest → `next build`, all required. Playwright e2e runs as an advisory (non-blocking) job until its coverage stabilizes.

### `.claude/` permissions

Default-allow, with an explicit deny-list for destructive commands — not an allowlist model.

### Review skills for this project

Beyond the general-purpose skills already installed (`code-review`, `security-review`, `tdd`, `domain-modeling`), this project needs custom review skills not yet written/sourced: `a11y-review`, `payload-access-control-review` (security, Payload-specific), `payload-performance-review` (Neon pooled connections, Payload `depth`, ISR caching, indexes, GraphQL N+1/pagination), and `bug-hunt-review` (proactive correctness/edge-case review, including GraphQL schema/type design). Each gets its own ticket under the Project Setup epic — see `docs/agents/labels.md`'s ticket depth policy.

### License

MIT.
