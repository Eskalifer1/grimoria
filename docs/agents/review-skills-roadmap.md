# Review skills roadmap

The general-purpose skills that ship with the `mattpocock-skills` plugin are a starting point, not the answer: this project owns its skills. `code-review` and `tdd` get **vendored** into `.claude/skills/` (the plugin is MIT) and adapted to point at this repo's docs; `implement` is rejected outright, because it instructs the agent to commit, which `docs/git-workflow.md` forbids. Only `grilling` is used from the plugin as-is.

On top of those, this project needs custom review skills not yet written/sourced:

- `a11y-review`
- `payload-access-control-review` (security, Payload-specific)
- `payload-performance-review` (Neon pooled connections, Payload `depth`, ISR caching, indexes, GraphQL N+1/pagination)
- `bug-hunt-review` (proactive correctness/edge-case review, including GraphQL schema/type design)

Each gets its own ticket. They are **not** flat under Project Setup: they live under the `Agent task-flow: process + skills` epic (#66), alongside the vendored skills above and the `task-flow` spine that orchestrates them — see `docs/agents/labels.md`'s ticket depth policy for why a Project Setup sub-issue that outgrows one ticket becomes its own epic. The live breakdown and blocking order are in #66; don't restate them here.

All four run as parallel sub-agents in the review stage of `task-flow`, alongside the vendored `code-review`'s Spec and Standards axes. Each declares its own model in frontmatter rather than inheriting from the orchestrator.
