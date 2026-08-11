# Label taxonomy

Every issue gets exactly one label from each of the three dimensions — **except epics**, see the
end. Names are flat, with no `area:`/`type:`/`priority:` prefixes.

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
- **`ready-for-agent`** — **load-bearing, not descriptive**: the gate between the two sessions of
  `/task-flow`, which is where the flow around it lives. **Absent on a non-`epic` issue means
  "grill this first"**, not "implement it carefully".

## Blocking

GitHub's **native issue dependencies**, not a label — commands in `docs/agents/issue-tracker.md`.

## Ticket depth

- **Project Setup epic** (tooling, lint, CI/CD, test and security skeletons, skills, design
  foundations): full sub-issue breakdown. A sub-issue
  spanning too many concerns takes the `epic` label and gets its own sub-issues.
- **All product features**, core and future alike: a single issue — title plus a short body
  capturing decisions already resolved — with no subtask breakdown.
- An enhancement to a bigger feature (RTE to Notes) is a line in the parent's body, not its own
  issue.

## Exception: epics carry only `epic` + a priority

No `area`, no `type`, for as long as the epic has not been broken down. Once broken down,
`area`/`type` go to the sub-issues and never to the parent.

Do not tag a parent with two `area` labels as a shortcut; wait for the real breakdown.

## Outside the taxonomy

GitHub's defaults (`bug`, `documentation`, `enhancement`, …) still exist on the repo but are wired
into nothing. Do not apply them ad hoc.
