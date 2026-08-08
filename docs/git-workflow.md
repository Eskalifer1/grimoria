# Git workflow

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys
continuously to Vercel production. Neon has two branches (`main`, `dev`), not one per PR. No
pre-commit hooks. Branch off `dev`.

**Not set up yet**: neither `dev` nor `main` exists — the default branch is `master`, and branch
protection is still to be configured (#43). Until that lands, work goes directly into `master`.
The paragraph above is the target, not today.

## Commit messages

Conventional Commits, these ten types and no others:

`feat:` new user-visible behavior · `fix:` shipped behavior was wrong · `perf:` same behavior,
faster · `refactor:` restructured, behavior identical · `style:` formatter ran, no logic
changed · `test:` tests only · `docs:` documentation only · `ci:` CI configuration only ·
`chore:` tooling, config, dependencies, repo upkeep · `revert:` undoing an earlier commit

**`style:` is not about styling** — palette, spacing and theming are `feat:`/`fix:`.

The type describes the primary change, not every file touched: a `chore:` commit that also
updates the README stays `chore:`. Scopes (`feat(notes):`) are optional.

## Who commits

**The agent never runs `git commit`.** It stages the change and proposes a title; the user runs
the commit. Once the user confirms it is done, close the tracking issue — never before that
confirmation.

**Why**: an agent-run commit triggered a signing prompt that broke the user's terminal session.

**Open gap**: nothing here yet defines when an agent should create a branch before starting a
task, or how to name it — tracked by #65.
