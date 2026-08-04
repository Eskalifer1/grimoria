# Git workflow

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys continuously to Vercel production. Neon has two branches (`main`, `dev`), not one per PR. No pre-commit hooks currently.

Branch off `dev`, not `main`.

## Commit messages

Conventional Commits. These ten types, no others:

| Type | Use it when |
| --- | --- |
| `feat:` | new user-visible behavior |
| `fix:` | shipped behavior was wrong |
| `perf:` | same behavior, faster |
| `refactor:` | restructured, behavior identical |
| `style:` | formatter ran, no logic changed |
| `test:` | tests only |
| `docs:` | documentation only |
| `ci:` | CI configuration only |
| `chore:` | tooling, config, dependencies, repo upkeep |
| `revert:` | undoing an earlier commit |

`style:` is not about styling — palette, spacing and theming are `feat:`/`fix:`.

The type describes the primary change, not every file touched: a `chore:` commit
that also updates README stays `chore:`.

Scopes (`feat(notes):`) are optional.

## Who commits

The agent never runs `git commit`. The user commits themselves.

- The agent stages/prepares the change and proposes a commit title (Conventional Commits style, e.g. `feat: add locale switcher`) — it does not write the full commit body or run the commit.
- The user runs the commit.
- Once the user confirms the commit is done, if the task was tracked by a GitHub issue, close it per `docs/agents/issue-tracker.md`. Don't close before that confirmation.

**Why**: an agent-run commit triggered a signing prompt that broke the user's terminal session.

**Open gap**: nothing here yet defines when/how an agent should create a branch before starting a task (naming, granularity) — tracked by issue #65.
