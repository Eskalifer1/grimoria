# Git workflow

Feature branches merge into `dev`; `dev` merges into `main` roughly weekly. `main` deploys continuously to Vercel production. Neon has two branches (`main`, `dev`), not one per PR. No pre-commit hooks currently.

Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, …).

Branch off `dev`, not `main`.

**Open gap**: nothing here yet defines when/how an agent should create a branch before starting a task (naming, granularity) — tracked by issue #65.
