---
name: task-flow
description: Run a tracker issue end to end — dispatch by label, then split an epic, grill an unspecified issue into a spec, or implement a ready one through verification to a commit handoff. /task-flow <n>.
argument-hint: "[issue-number]"
disable-model-invocation: true
allowed-tools: Bash(gh issue view:*), Bash(gh api:*)
---

# Task flow — issue #$0

Which mode a tracker issue needs, and where that mode is written down.

## The ticket

!`n=$(printf '%s' "$0" | sed 's#.*/##'); gh issue view "$n" --json number,title,state,labels,body,comments --jq '"#\(.number) \(.title)  [\(.state)]\nlabels: \([.labels[].name]|join(", "))\n\n\(.body)\n\n\(([.comments[]|"--- comment by \(.author.login)\n\(.body)"])|join("\n"))"'`

## Sub-issues

!`n=$(printf '%s' "$0" | sed 's#.*/##'); gh api repos/{owner}/{repo}/issues/$n/sub_issues --jq '.[] | "\(.number) \(.state) \(.title)"' 2>&1 || echo "none"`

Where a comment and the body disagree, **the comment wins** — the body is stale, and the mode below
fixes it.

## Dispatch — by label, no judgement

Read the one file the row names, in this folder, and follow it. Read no other row's file.

| Issue state | File |
| --- | --- |
| has `epic`, sub-issues listed above | `frontier.md` |
| has `epic`, no sub-issues | `breakdown.md` — no code |
| no `epic`, no `ready-for-agent` | `spec.md` |
| no `epic`, has `ready-for-agent` | invoke `/implement-issue` with the number |

**Read the sub-issue list above, not the label, to tell a broken-down epic from a fresh one** —
`epic` stays on the parent either way.

**Pass the bare number on, whatever this skill was handed.** The ticket block above prints it as
`#<number>`; a URL pasted into the argument reaches downstream skills as a branch name and a broken
API path.

## This repo's configuration is already settled

**Never run `/setup-matt-pocock-skills`.** The tracker is `docs/agents/issue-tracker.md`, the labels
are `docs/agents/labels.md`, and personas are skills rather than `.claude/agents/` — #66.
