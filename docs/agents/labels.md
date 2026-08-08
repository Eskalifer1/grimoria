# Label taxonomy

Every GitHub issue gets exactly one label from each of the three dimensions below — **except
epics**, see the end. These are project-specific organizing labels for search and filtering,
separate from the `triage` skill's canonical labels (not installed here).

Names are flat, with **no `area:`/`type:`/`priority:` prefixes** — that is how they exist on
GitHub (`gh label list`).

## area — what part of the codebase

- `frontend` — client/admin UI (single app, gated `/admin` routes, ADR-0001)
- `backend` — Payload collections, access control, API routes (embedded in Next.js, ADR-0005)
- `design` — visual design work: logo, icons, dark-fantasy identity, meta/favicon assets. Not
  code.
- `infra` — tooling, CI/CD, project setup, skills, non-feature-specific configuration

## type — what kind of work

- `NewFeature` — a product-facing capability that does not exist yet (core or future; see
  `priority` for which)
- `chore` — setup/maintenance with no product-facing behavior
- `research` — investigating options before a decision can be made
- `decision` — recording/settling a choice; typically produces or updates an ADR

## priority

- `critical` — blocking; must land before other work can proceed
- `priority` — planned for the current push, roughly v1/core scope
- `not-a-priority` — future/non-core, deliberately parked with a bare title and short body

## Workflow labels (outside the three dimensions)

- `epic` — a parent task that has subtasks now or will get them later, so epics are quick to
  find. Applies to a top-level feature issue not yet broken down, and equally to a non-top-level
  issue that outgrows a single ticket and gets its own sub-issue breakdown directly.
- `ready-for-agent` — fully specified, ready for an AFK agent. This label is **load-bearing,
  not descriptive**: it is the gate between the two sessions of the task flow (#66). A grilling
  session ends by writing its conclusions as a comment and applying this label; an
  implementation session refuses to start without it. **Absent on a non-`epic` issue means
  "grill this first"**, not "implement it carefully".

## Not part of the taxonomy

GitHub's default set (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`,
`help wanted`, `invalid`, `question`, `wontfix`) still exists on the repo but is wired into no
taxonomy or skill convention. Decide deliberately whether to prune them or give them a role
(e.g. `bug` for defect reports, which `type` does not currently cover) rather than applying
them ad hoc.

## Blocking relationships

Use GitHub's **native issue dependencies**, not a label — exact `gh api` commands are in
`docs/agents/issue-tracker.md`. Native dependencies are live-computed, never go stale, and show
in the sidebar as "Blocked by #N". A manual `blocked` label was rejected: keeping it in sync
would need a dedicated GitHub Action, not worth the setup cost here.

## Ticket depth policy

- **Project Setup epic** (tooling, lint, CI/CD, test and security infra skeletons, skills,
  design system foundations): full detailed sub-issue breakdown, since this work starts
  immediately. A Project Setup sub-issue spanning too many distinct concerns for one ticket is
  broken down the same way — it takes the `epic` label and gets its own sub-issues parented to
  it, rather than staying flat under Project Setup.
- **All product features**, core and future alike: a single issue — title plus a short body
  capturing decisions already resolved, such as content format or visibility rules — with no
  subtask breakdown. Subtasking happens later, per feature, closer to implementation.
- A feature that is really an enhancement to a bigger one (RTE is an enhancement to Notes) is a
  line in the parent issue's body, not its own issue.

## Exception: epics carry only `priority:*` and `epic`

An issue carrying `epic` gets **only** `epic` plus a priority label — no `area`, no `type` —
for as long as it has not been broken down, since it usually spans more than one of each. Once
broken down, `area`/`type` go to the resulting sub-issues and never to the parent. Do not tag a
parent with more than one `area` as a shortcut; wait for the real breakdown.
