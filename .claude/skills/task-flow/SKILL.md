---
name: task-flow
description: Run a tracker issue end to end — dispatch by label, then either break an epic into sub-issues, grill an unspecified issue into a spec, or implement a ready one through verification to a commit handoff. Invoked as /task-flow <issue-number>.
---

# Task flow

From a tracker issue to a result ready for the user to commit.

**Read the ticket with `gh issue view <n> --comments`.** Where a comment and the body disagree,
the comment wins and the body is stale — fix it in session 1.

**Never run `/setup-matt-pocock-skills`** — this repo already configures what it would ask for: the
tracker is `docs/agents/issue-tracker.md`, the label vocabulary is `docs/agents/labels.md`.

## Dispatch — by label, no judgement

| Issue state | Mode |
| --- | --- |
| has `epic`, already has sub-issues | **Frontier** below |
| has `epic`, no sub-issues | **Breakdown** — read `breakdown.md` in this folder and follow it. No code |
| no `epic`, no `ready-for-agent` | **Session 1** below |
| no `epic`, has `ready-for-agent` | **Session 2** — read `implement.md` in this folder and follow it |

`epic` stays on the parent after a breakdown, so the label alone does not say whether one has
happened. Ask GitHub:

```bash
gh api repos/{owner}/{repo}/issues/<n>/sub_issues --jq '.[] | "\(.number) \(.state) \(.title)"'
```

## Frontier — an epic that is already broken down

Never break it down again. List the open children whose blockers are all closed and hand the user
the choice:

```bash
gh api repos/{owner}/{repo}/issues/<child> --jq '.issue_dependencies_summary.blocked_by'
```

`blocked_by` counts **open** blockers only. Present the ready children
in issue order with their labels; on the user's pick, re-enter this skill on that number.

## Session 1 — turn a ticket into a spec

1. `/mattpocock-skills:grill-me` on the ticket.
2. `/mattpocock-skills:to-spec`, with one departure: **it publishes into this issue, not a new
   one.** The spec replaces the body; what the grilling dropped is deleted.
3. `gh issue edit <n> --add-label ready-for-agent`, then stop.

If the ticket turns out to need more than one slice, it takes `epic` and goes to `breakdown.md`
instead.

## No `.claude/agents/` in this repo

Personas are skills. The argument is in #66.
