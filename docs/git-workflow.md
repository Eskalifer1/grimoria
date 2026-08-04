# Git workflow

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys continuously to Vercel production. Neon has two branches (`main`, `dev`), not one per PR. No pre-commit hooks currently.

Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, …).

Branch off `dev`, not `main`.

## Who commits

The agent never runs `git commit`. The user commits themselves.

- The agent stages/prepares the change and proposes a commit title (Conventional Commits style, e.g. `feat: add locale switcher`) — it does not write the full commit body or run the commit.
- The user runs the commit.
- Once the user confirms the commit is done, if the task was tracked by a GitHub issue, close it per `docs/agents/issue-tracker.md`. Don't close before that confirmation.

**Why**: an agent-run commit triggered a signing prompt that broke the user's terminal session.

**Open gap**: nothing here yet defines when/how an agent should create a branch before starting a task (naming, granularity) — tracked by issue #65.
