---
name: implement-issue
description: Implement a `ready-for-agent` tracker issue from branch to commit handoff — standards read, test-first, two gates, self-verify, review axes, triage, acceptance check, docs sync. Invoked as /implement-issue <issue-number>, and dispatched to by /task-flow for a ready ticket.
argument-hint: "[issue-number]"
allowed-tools: Bash(gh issue view:*), Bash(gh issue comment:*), Bash(git checkout:*), Bash(git diff:*), Bash(git status:*), Bash(yarn check:*), Bash(yarn typecheck:*), Bash(yarn spellcheck:*), Bash(yarn build:*)
---

# Implement issue #$0

A `ready-for-agent` ticket, from branch to the commit the user runs. `/task-flow` decides which
issues reach here; `failures.md` in this folder covers a step that cannot complete.

## The ticket

!`gh issue view $0 --comments`

## Steps

| # | Step | Who | Where |
| --- | --- | --- | --- |
| 1 | Confirm the ticket carries a spec | main agent | here |
| 2 | Create the branch | main agent | `docs/git-branching.md` |
| 3 | Read the standards this task touches | main agent | here |
| 4 | Implement test-first, record the decisions | **main agent** | `/mattpocock-skills:tdd` |
| 5 | Fast gate | subagent | `/checks` |
| 6 | Self-verify against the requirements, 2–3 rounds | fresh subagent finds, main agent judges | here |
| 7 | Full gate | subagent | `/checks` |
| 8 | Review axes in parallel | workflow | `/review-axes` |
| 9 | Triage and fix | main agent | here |
| 10 | Re-run | main agent | here |
| 11 | Acceptance check against the issue | fresh subagent | here |
| 12 | `/docs-sync` | main agent | here |
| 13 | Full gate, propose a commit title, stop | main agent | `docs/git-workflow.md` |

### 1 — confirm the spec, not just the label

The body must carry the sections session 1 produces: problem, solution, user stories, implementation
and testing decisions, acceptance criteria. **A label with no spec goes back to `/task-flow`.**

### 3 — read the standards first

- **Route by the files the code will touch**, not by the issue's `area` label — a frontend ticket
  that adds a login form touches auth too.
- **Every coding standard covering a changed file, always.**
- **The design docs when a surface has to be invented** — a new page with no mock.

**Write the docs read to `.scratch/$0.md` under `## Read`** before writing any code.

### 4 — implement

Test-first, through `/mattpocock-skills:tdd`: **one seam, one failing test, one implementation, next
slice**, against the seams the spec settled. Confirm the seams with the user before the first test
where the spec left them open.

**Record decisions as they are made**, to `.scratch/$0.md` under `## Decisions` — one line each:
what was chosen, and what was rejected where a reviewer would plausibly propose it back. Step 9
reads this file.

### 5 and 7 — the two gates

| Gate | Commands | When |
| --- | --- | --- |
| **Fast** — `/checks fast` | `yarn check` → `yarn typecheck` → `yarn spellcheck` | Step 5, and after every fix in steps 6, 9, 10 |
| **Full** — `/checks` | the fast gate, then `yarn test` → `yarn build` | Step 7, and again at step 13 |

`/checks` forks its own subagent on the cheapest model, so none of it lands here. **Failures come
back verbatim; a green run is one line and nothing else.**

**Red stops the flow**, including a failure that looks unrelated to this ticket. Fix and re-run
until green.

### 6 — self-verify

Each round: a **fresh** subagent gets only the issue with comments and the diff — never the author's
reasoning — and returns, under a schema, where the code diverges from the requirements.

**Judge each divergence before acting on it.** Check the claim against the code, fix what holds,
report which claims were rejected and on what grounds. Then the fast gate again.

**Two rounds minimum; a third only if the second still found something**, ceiling of three.
Whatever is left goes into an issue comment as known debt.

**The screenshot-against-the-design round turns on once a visual reference exists** to compare
against.

### 8 — review axes

Invoke `/review-axes` with the issue number and the git range — the workflow at
`.claude/workflows/review-axes.js`.

| Axis | Carrier |
| --- | --- |
| Standards + Fowler smells | `/mattpocock-skills:code-review` |
| a11y | `/a11y-review` |
| Payload access control | not yet — #45 |
| Payload performance | not yet — #46 |
| bug hunt | not yet — #47 |

**What a review may report at all is `docs/agents/coding-standards/review-boundaries.md`.** The axes
only report; nothing changes until step 9.

### 9 — triage

Decide here; reach for the user only at the end:

- **A gate failure is always fixed**, never raised.
- **A review finding must name the rule it breaks**, per `review-boundaries.md`. One that argues
  from taste is dropped with a line in the report, and is owed no counter-argument.
- **Open the named doc and read the named line before accepting a finding.** A citation that does
  not say what the finding claims makes it taste. Judge what survives against the standards read at
  step 3 and the decisions recorded at step 4, then fix what holds.
- **A fix that reaches outside the ticket goes to the user, not into the branch** — one touching
  files the ticket did not, or changing behavior the spec settled. Ask with the finding, both
  options, and a recommendation.
- **Ask when the call is genuinely open**, both readings defensible.

### 10 — re-run

The fast gate after every fix, the full gate once the fixes stop, then `/review-axes` again over the
fix diff. **Invoke the workflow fresh** — an agent cannot resume a run.

Two full cycles maximum; what is still open goes into an issue comment as known debt.

### 11 — acceptance check

A **fresh** subagent gets the issue with comments and the final diff and returns, under a schema,
one verdict per acceptance criterion: met, not met, or out of scope. Anything not met goes back to
step 9, and the loop re-enters at step 11, not at step 12.

### 12 — docs

`/docs-sync`. Its deletion pass runs over anything written here, and its report folds into step 13.

### 13 — handoff

The full gate one last time, over code and docs together. Then the report, **assembled from
`.scratch/$0.md` rather than from memory**: the docs read, what the gates and the axes found, what
was fixed, what was rejected and why, what `/docs-sync` cut, and the step-11 verdict per criterion.

Every step from 5 on appends its outcome to that file as it finishes — one or two lines, written at
the time.

**A step with no line in the file is reported as unrecorded, not reconstructed.** Say which steps
are missing and hand over anyway; the user decides whether to re-run them.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.
