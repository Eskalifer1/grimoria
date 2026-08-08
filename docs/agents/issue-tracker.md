# Issue tracker: GitHub

Issues and PRDs live as GitHub issues; use the `gh` CLI, which infers the repo from the clone.
Use a heredoc for multi-line bodies.

**When a skill says "publish to the issue tracker"** → create a GitHub issue.
**When a skill says "fetch the relevant ticket"** → `gh issue view <number> --comments`.

## PRs as a request surface: no

_(Set to `yes` if this repo starts treating external PRs as feature requests; `/triage` reads
this flag.)_ When `yes`, PRs run through the same labels and states as issues via the `gh pr`
equivalents, and triage lists keep only `authorAssociation` of `CONTRIBUTOR`,
`FIRST_TIME_CONTRIBUTOR` or `NONE`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve
with `gh pr view 42`, falling back to `gh issue view 42`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue labelled `wayfinder:map` holding the Notes
/ Decisions-so-far / Fog body; **tickets** are its GitHub sub-issues, labelled
`wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`) and assigned once claimed.

**Blocking uses GitHub's native issue dependencies** — the canonical, UI-visible
representation:

```bash
gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by \
  -F issue_id=<blocker-db-id>
```

`<blocker-db-id>` is the blocker's numeric **database id**
(`gh api repos/<owner>/<repo>/issues/<n> --jq .id`) — **not** the `#number` and not the
`node_id`. GitHub then reports `issue_dependencies_summary.blocked_by`, counting open blockers
only, which is the live gate. Where dependencies are unavailable, fall back to a
`Blocked by: #<n>` line at the top of the child body.

**Frontier query**: the map's open children, minus any with an open blocker or an assignee;
first in map order wins. **Claim** with `--add-assignee @me` as the session's first write.
**Resolve** by commenting the answer, closing, then appending a context pointer (gist + link)
to the map's Decisions-so-far.
