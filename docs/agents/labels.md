# Label taxonomy

Every GitHub issue in this repo gets exactly one label from each of the three dimensions below — **except epic issues**, see the exception at the end. This is separate from the `triage` skill's canonical labels (not installed in this repo) — these are project-specific organizing labels for ticket search/filtering, decided during the initial `/grill-with-docs` planning session.

These are the labels as they actually exist on GitHub (`gh label list`) — flat names, **no `area:`/`type:`/`priority:` prefixes**. An earlier draft of this doc used prefixed names (`area:frontend`, `type:feature`, `priority:critical`); that scheme was never applied on GitHub, so this doc now follows reality rather than the other way around.

## area

What part of the codebase the work touches:

- `frontend` — client/admin UI (single app, gated `/admin` routes — see ADR-0001)
- `backend` — Payload CMS collections, access-control, and API routes (embedded in Next.js — ADR-0005)
- `design` — visual design work (logo, icons, dark-fantasy visual identity, meta/favicon assets) — not code
- `infra` — tooling, CI/CD, project setup, skills, non-feature-specific configuration

## type

What kind of work the issue represents:

- `NewFeature` — a product-facing capability that doesn't exist in the project yet (core or future — see `priority` below for which)
- `chore` — setup/maintenance work with no product-facing behavior
- `research` — investigating options before a decision can be made (library choice, approach choice)
- `decision` — recording/settling a choice; typically produces or updates an ADR in `docs/adr/`

## priority

- `critical` — blocking, must land before other work can proceed
- `priority` — planned for the current push (roughly: v1/core scope)
- `not-a-priority` — future/non-core; deliberately parked with a bare title + short body, no subtasks

## Workflow labels (outside the three dimensions)

- `epic` — parent task that has subtasks now or will get them later, for quickly finding epics. This is the label for a top-level feature issue that hasn't been broken down yet (see the exception below — it replaces what an earlier draft of this doc called a "bare stub").
- `ready-for-agent` — fully specified, ready for an AFK agent. Apply once a sub-issue has enough detail (acceptance criteria settled, no open questions) that an agent can pick it up and implement without further clarification — this is the label `/implement` should look for when picking work autonomously.

## Not part of the taxonomy

GitHub's default label set (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`) still exists on the repo but isn't wired into this taxonomy or any skill convention. Decide deliberately whether to prune them or give them a role (e.g. `bug` for defect reports, which the `type` dimension above doesn't currently cover) rather than applying them ad hoc.

## Blocking relationships

Use GitHub's **native issue dependencies**, not a label — see `docs/agents/issue-tracker.md` under "Wayfinding operations" for the exact `gh api` commands. Native dependencies are live-computed (never go stale) and show in the issue sidebar as "Blocked by #N"; a manual `blocked` label was considered and rejected because keeping it in sync would require a dedicated GitHub Action, which wasn't judged worth the setup cost for this project.

## Ticket depth policy

- **Project Setup** epic (tooling, lint, CI/CD, test infra skeleton, security infra skeleton, skills, design system foundations): full detailed sub-issue breakdown, since this work starts immediately.
- **All product features** (core and future alike): a single issue — title + a short body capturing any decisions already resolved for that feature (e.g. content format, visibility rules) — no subtask breakdown. Subtasking happens later, per-feature, in a dedicated session closer to implementation.
- A feature that's really an enhancement to a bigger feature (e.g. RTE is an enhancement to Notes) is a line in the parent issue's body, not its own issue.

## Exception: epic issues carry only `priority:*` and `epic`

A top-level feature issue gets **only** the `epic` label plus a `priority:*` label — no `area` and no `type`, since the issue hasn't been broken down yet and usually spans both frontend and backend. `area`/`type` only get assigned once the feature is actually taken through `/to-spec` + `/to-tickets`: each resulting sub-issue then gets its own `area` (frontend sub-issue vs. backend sub-issue) and `type` label. Don't tag the parent with both `frontend` and `backend` as a shortcut — wait for the real breakdown.
