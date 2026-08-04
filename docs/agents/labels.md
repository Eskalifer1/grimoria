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

- `epic` — parent task that has subtasks now or will get them later, for quickly finding epics. Applies to a top-level feature issue that hasn't been broken down yet, and equally to a non-top-level issue that outgrows a single ticket and gets its own sub-issue breakdown directly, without going through `/to-spec` + `/to-tickets` (see the exception below — it replaces what an earlier draft of this doc called a "bare stub").
- `ready-for-agent` — fully specified, ready for an AFK agent. Apply once a sub-issue has enough detail (acceptance criteria settled, no open questions) that an agent can pick it up and implement without further clarification. This label is **load-bearing**, not descriptive: it's the gate between the two sessions of the task flow (#66). A grilling session ends by writing its conclusions as a comment and applying this label; an implementation session refuses to start without it. Absent on a non-`epic` issue means "grill this first", not "implement it carefully".

## Not part of the taxonomy

GitHub's default label set (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`) still exists on the repo but isn't wired into this taxonomy or any skill convention. Decide deliberately whether to prune them or give them a role (e.g. `bug` for defect reports, which the `type` dimension above doesn't currently cover) rather than applying them ad hoc.

## Blocking relationships

Use GitHub's **native issue dependencies**, not a label — see `docs/agents/issue-tracker.md` under "Wayfinding operations" for the exact `gh api` commands. Native dependencies are live-computed (never go stale) and show in the issue sidebar as "Blocked by #N"; a manual `blocked` label was considered and rejected because keeping it in sync would require a dedicated GitHub Action, which wasn't judged worth the setup cost for this project.

## Ticket depth policy

- **Project Setup** epic (tooling, lint, CI/CD, test infra skeleton, security infra skeleton, skills, design system foundations): full detailed sub-issue breakdown, since this work starts immediately. A Project Setup sub-issue that itself turns out to span too many distinct concerns for one ticket can be broken down the same way — it picks up the `epic` label (see the exception below) and gets its own sub-issues parented to it, rather than staying flat under Project Setup directly.
- **All product features** (core and future alike): a single issue — title + a short body capturing any decisions already resolved for that feature (e.g. content format, visibility rules) — no subtask breakdown. Subtasking happens later, per-feature, in a dedicated session closer to implementation.
- A feature that's really an enhancement to a bigger feature (e.g. RTE is an enhancement to Notes) is a line in the parent issue's body, not its own issue.

## Exception: epic issues carry only `priority:*` and `epic`

An issue carrying the `epic` label gets **only** `epic` plus a `priority:*` label — no `area` and no `type` — for as long as it hasn't been broken down into its own sub-issues, since it usually spans more than one area/type. This covers both a top-level feature issue (broken down via `/to-spec` + `/to-tickets`) and a non-top-level issue that outgrows a single ticket and gets its own sub-issue breakdown directly. Once broken down, `area`/`type` get assigned only to the resulting sub-issues, never to the parent `epic` issue itself. Don't tag the parent with more than one `area` (e.g. both `frontend` and `backend`) as a shortcut — wait for the real breakdown.
