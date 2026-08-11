# Branching

Which branch a task runs on and what it is called. Commit messages, who runs the commit, and what
lands where are `docs/git-workflow.md`.

**Work starts on a new branch, never on whatever is checked out.** Branch off `dev`.

**One branch per GitHub issue.**

**Name it `<type>/<issue>-<slug>`** — `type` is one of the ten Conventional Commit types in
`docs/git-workflow.md`, `issue` is the number, `slug` is two to four kebab-case words from the
title. `feat/83-user-avatar-upload`.

**Nothing enforces this yet** — #43 is canonical for enforcement.
