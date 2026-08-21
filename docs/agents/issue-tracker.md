# Issue tracker: GitHub

Issues and PRDs live as GitHub issues; use the `gh` CLI, which infers the repo from the clone.
Use a heredoc for multi-line bodies.

**When a skill says "publish to the issue tracker"** → create a GitHub issue.
**When a skill says "fetch the relevant ticket"** → `gh issue view <number> --comments`.

## Comments

**A comment carries what the ticket's body and the repository cannot say on their own** — American
English, whatever language the conversation ran in.

**Fifteen lines is the ceiling.** Past it, the comment is holding something that belongs in a doc,
in the spec, or nowhere.

A landing comment has three parts and stops:

```
Landed in `<sha>`.

<what was decided during the work that the spec did not settle — one line each, or omit>

Known gaps: <what a reader would otherwise expect to work and does not — or omit>
```

**Leave out what the reader can already see**: a file-by-file table (the diff has it), gate output
(the run has it), the acceptance criteria restated (the body has them), and any account of how the
work proceeded. A decision is worth a line when someone would otherwise reverse it; the rest is not.

## PRs as a request surface: no

`/triage` reads this flag; flip it to `yes` if external PRs ever become feature requests.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve
with `gh pr view 42`, falling back to `gh issue view 42`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue labeled `wayfinder:map` holding the Notes
/ Decisions-so-far / Fog body; **tickets** are its GitHub sub-issues, labeled
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
