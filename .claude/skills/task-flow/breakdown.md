# Breaking an epic into sub-issues

**No code is written in this mode.**

The chain is `/mattpocock-skills:grill-me` → `/mattpocock-skills:to-spec` →
`/mattpocock-skills:to-tickets`. Below is where this repo departs from them.

## Depth — before to-tickets runs

`docs/agents/labels.md` sets it. **An enhancement to a bigger feature is a line in the
parent's body, not its own issue.**

## to-spec — publish into the epic

The spec replaces the epic's body rather than opening a new issue, and it does **not** carry
`ready-for-agent`.

## to-tickets — three departures

- **Labels.** Each sub-issue carries **one from each of the three dimensions** — area, type,
  priority — per `docs/agents/labels.md`. `ready-for-agent` goes on only where the grilling settled
  that sub-issue completely.
- **The parent is modified.** After publishing, rewrite the epic body to the map of what the
  grilling settled and what the children are, and **delete what the children now own**. The epic
  keeps only `epic` plus a priority.
- **Blocking edges** use GitHub's **native issue dependencies** — the exact `gh api` call and the
  database-id trap are in `docs/agents/issue-tracker.md`. Each body opens with `Part of #<epic>`.

A sub-issue spanning more than one concern takes `epic` itself and gets its own breakdown.
