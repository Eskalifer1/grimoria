# Session 2 — implementing a ready ticket

Reached from `SKILL.md` when the issue has `ready-for-agent` and no `epic`.

| # | Step | Who | Where |
| --- | --- | --- | --- |
| 1 | Read the ticket, confirm it carries a spec | main agent | here |
| 2 | Create the branch | main agent | `docs/git-branching.md` |
| 3 | Read the standards this task touches | main agent | here |
| 4 | Implement test-first, record the decisions | **main agent** | `/mattpocock-skills:tdd` |
| 5 | Fast gate | subagent | `/checks` |
| 6 | Self-verify against the requirements, 2–3 rounds | fresh subagent finds, main agent judges | here |
| 7 | Full gate | subagent | `/checks` |
| 8 | Review axes in parallel | subagents | `.claude/workflows/verify.js` |
| 9 | Triage and fix | main agent | here |
| 10 | Re-run | main agent | here |
| 11 | Acceptance check against the issue | fresh subagent | here |
| 12 | `/docs-sync` | main agent | here |
| 13 | Full gate, propose a commit title, stop | main agent | `docs/git-workflow.md` |

### 1 — confirm the spec, not just the label

Check that the body actually carries the spec sections session 1 produces — problem, solution, user
stories, implementation and testing decisions, acceptance criteria. **A ticket with the label and no
spec goes back to session 1.**

### 3 — read the standards first

Route by what the code will touch, never by the issue's `area` label — a frontend ticket that adds a
login form touches auth too.

- **The coding standards always.** Every one that covers a file this ticket will change.
- **The design docs only when a surface has to be invented** — a new page with no mock. A feature
  added to a page that already exists does not need them.
- **The neighboring area's docs by what the code reaches**, not by whose ticket it is.

**Write the list of docs read to `.scratch/<issue>.md` under `## Read`** before writing any code.

### 4 — implement

Test-first, through `/mattpocock-skills:tdd`: **one seam, one failing test, one implementation, next
slice.** The seams are the ones the spec settled in session 1; confirm them with the user before the
first test if the spec did not. Writing the whole test suite up front is an anti-pattern in that
skill, not the instruction here.

**Test-first waits on #28** (Vitest + RTL harness). Until it lands, this step is implementation
only.

**Write the decisions down as they are made**, to `.scratch/<issue>.md` under `## Decisions` — one
line each: what was chosen, and what was rejected where a reviewer would plausibly propose it back.
The triage at step 9 reads this file.

### 5 and 7 — the two gates

| Gate | Commands | When |
| --- | --- | --- |
| **Fast** | `yarn check` → `yarn typecheck` → `yarn spellcheck` | Step 5, and after every fix in steps 6, 9, 10 |
| **Full** | the fast gate, then Vitest (#28) → `yarn build` | Step 7, and again at step 13 |

Both run through `/checks` in a subagent, on the cheapest model. **Failures come back verbatim; a green run returns an
empty failure list and nothing else.**

**Red stops the flow**, including a failure that looks unrelated to this ticket. Fix and re-run
until green.

### 6 — self-verify

Each round: a **fresh** subagent gets only the issue with comments and the diff — never the author's
reasoning — and returns, under a schema, where the code diverges from the requirements.

**The main agent judges each divergence before acting on it.** Check the claim against the code, fix
what holds, and report which claims were rejected and on what grounds. Then the fast gate again.

**Two rounds minimum; a third only if the second still found something**, ceiling of three. Whatever
is left goes into an issue comment as known debt.

**The UI branch — a screenshot against the design — does not exist yet.** It turns on when there is
a visual reference to compare against.

### 8 — review axes

`.claude/workflows/verify.js`: the axes run in parallel, each its own subagent with its own schema.

| Axis | Carrier |
| --- | --- |
| Standards + Fowler smells | `/mattpocock-skills:code-review` |
| a11y | not yet — #44 |
| Payload access control | not yet — #45 |
| Payload performance | not yet — #46 |
| bug hunt | not yet — #47 |

**Which findings a review may report at all is `docs/agents/coding-standards/review-boundaries.md`.**
The axes only report; nothing is changed until step 9.

### 9 — triage

The main agent decides, and reaches for the user only at the end:

- **A gate failure is always fixed**, never raised.
- **A review finding must name the rule it breaks**, per `review-boundaries.md`. One that argues
  from taste is dropped with a line in the report, and it is owed no counter-argument.
- **Open the named doc and read the named line before accepting a finding.** A citation that does
  not say what the finding says it says makes the finding taste, and it drops. Judge what survives
  against the standards read at step 3 and the decisions recorded at step 4, then fix what holds.
- **A fix that reaches outside the ticket goes to the user, not into the branch** — one that touches
  files the ticket did not, or changes behavior the spec settled. Ask with the finding, both
  options, and a recommendation.
- **Ask when the call is genuinely open**, both readings defensible.

### 10 — re-run

The fast gate after every fix, the full gate once the fixes stop; the review axes over the fix diff.
Relaunch with `Workflow({scriptPath, resumeFromRunId})` — the unchanged prefix of `agent()` calls
returns from cache. **Resume works within the same session only.**

Two full cycles maximum; what is still open goes into an issue comment as known debt.

### 11 — acceptance check

A **fresh** subagent gets the issue with comments and the final diff and returns, under a schema,
one verdict per acceptance criterion: met, not met, or out of scope. Anything not met goes back to
step 9, and the loop re-enters at step 11, not at step 12.

### 12 — docs

`/docs-sync`. Its deletion pass runs over anything written here, and its report is folded into
step 13.

### 13 — handoff

The full gate one last time, over code and docs together. Then the report, **assembled from
`.scratch/<issue>.md` rather than from memory**: the docs read, what the gates and the axes found,
what was fixed, what was rejected and why, what `/docs-sync` cut, and the step-11 verdict per
criterion.

Every step from 5 on appends its outcome to that file as it finishes — one or two lines, written at
the time.

**A step with no line in the file is reported as unrecorded, not reconstructed.** Say which steps
are missing and hand over anyway; the user decides whether to re-run them.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.

When a step cannot complete — a gate that will not go green, a branch that already exists, an issue
closed mid-flow — read `failures.md` in this folder.
