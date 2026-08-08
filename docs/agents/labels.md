# Label taxonomy

Every issue gets exactly one label from each of the three dimensions — **except epics**, see the
end. Names are flat, with no `area:`/`type:`/`priority:` prefixes. Project-specific organizing
labels, separate from the `triage` skill's canonical set (not installed here).

**area** — `frontend` (client UI) · `backend` (Payload collections, access control, API
routes) · `design` (logo, icons, visual identity, meta assets — not code) · `infra` (tooling,
CI/CD, project setup, skills, config)

**type** — `NewFeature` (a product-facing capability that does not exist yet) · `chore`
(maintenance with no product-facing behavior) · `research` (investigating before a decision) ·
`decision` (settling a choice; usually produces an ADR)

**priority** — `critical` (blocking other work) · `priority` (current push, roughly v1 scope) ·
`not-a-priority` (future/non-core, parked with a bare title and short body)

## Workflow labels (outside the three dimensions)

- **`epic`** — a parent task with subtasks now or later. Applies to a top-level feature issue
  not yet broken down, and to any issue that outgrows one ticket and gets its own breakdown.
- **`ready-for-agent`** — **load-bearing, not descriptive**: the gate between the two sessions
  of the task flow (#66). A grilling session ends by writing its conclusions as a comment and
  applying this label; an implementation session refuses to start without it. **Absent on a
  non-`epic` issue means "grill this first"**, not "implement it carefully".

## Blocking

GitHub's **native issue dependencies**, not a label — commands in `docs/agents/issue-tracker.md`.
They are live-computed, never go stale, and show in the sidebar as "Blocked by #N". A manual
`blocked` label was rejected: keeping it in sync needs a dedicated Action.

## Ticket depth

- **Project Setup epic** (tooling, lint, CI/CD, test and security skeletons, skills, design
  foundations): full sub-issue breakdown, since this work starts immediately. A sub-issue
  spanning too many concerns takes the `epic` label and gets its own sub-issues.
- **All product features**, core and future alike: a single issue — title plus a short body
  capturing decisions already resolved — with no subtask breakdown. Subtasking happens later,
  per feature, closer to implementation.
- An enhancement to a bigger feature (RTE to Notes) is a line in the parent's body, not its own
  issue.

## Exception: epics carry only `epic` + a priority

No `area`, no `type`, for as long as the epic has not been broken down — it usually spans more
than one of each. Once broken down, `area`/`type` go to the sub-issues and never to the parent.
Do not tag a parent with two `area` labels as a shortcut; wait for the real breakdown.

## Outside the taxonomy

GitHub's defaults (`bug`, `documentation`, `enhancement`, …) still exist on the repo but are
wired into nothing. Decide deliberately whether to prune them or give them a role — `bug` for
defect reports is the obvious gap in `type` — rather than applying them ad hoc.
