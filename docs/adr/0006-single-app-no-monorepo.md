# Single Next.js project at the repo root, no monorepo/workspaces

The repo is one ordinary Next.js project (standard `src/`, `payload.config.ts`, single `package.json`) — no `apps/*`/`packages/*` workspace structure, no Turborepo/Nx.

With Payload embedded inside Next.js (ADR-0005), there is only ever one deployable, so workspace tooling would have no job to do — it'd be solving a coordination problem that doesn't exist here.

If a genuinely separate deployable ever shows up (e.g. an unrelated marketing site), migrating to a monorepo at that point is a mechanical restructure, not a data or architecture change — cheap to do later, not worth paying for now.
