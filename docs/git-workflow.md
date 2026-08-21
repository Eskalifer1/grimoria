# Git workflow

Commit messages, who commits, and what lands where. **How a branch is created and named is
`docs/git-branching.md`.**

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys
continuously to Vercel production. Neon has two branches (`main`, `dev`), not one per PR. No
pre-commit hooks.

**Nothing enforces the flow yet** — branch protection is #43, which is canonical for what lands
where.

## Commit messages

Conventional Commits, these ten types:

`feat:` new user-visible behavior · `fix:` shipped behavior was wrong · `perf:` same behavior,
faster · `refactor:` restructured, behavior identical · `style:` formatter ran, no logic
changed · `test:` tests only · `docs:` documentation only · `ci:` CI configuration only ·
`chore:` tooling, config, dependencies, repo upkeep · `revert:` undoing an earlier commit

**`style:` is not about styling** — palette, spacing and theming are `feat:`/`fix:`.

The type describes the primary change, not every file touched: a `chore:` commit that also
updates the README stays `chore:`.

## Who commits

**The agent never runs `git commit`.** It stages the change and proposes a title; the user runs
the commit. Once the user confirms it is done, close the tracking issue — never before that
confirmation.

**The comment that closes an issue takes the landing shape in `docs/agents/issue-tracker.md`** —
fifteen lines, American English, no file table and no gate output.

Held by `permissions.deny` in `.claude/settings.json`.
