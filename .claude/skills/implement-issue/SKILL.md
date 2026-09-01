---
name: implement-issue
description: Implement a ready-for-agent tracker issue from branch to commit handoff — standards routed, test-first slices in subagents, a judging round, triage, docs sync. /implement-issue <n>; dispatched by task-flow.
argument-hint: "[issue-number]"
model: opus
effort: medium
allowed-tools: Bash(gh issue view:*), Bash(gh issue comment:*), Bash(git checkout:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*), Bash(.claude/bin/standards.sh:*), Bash(.claude/bin/judge-needed.sh), Bash(.claude/bin/gate.sh:*)
---

# Implement issue #$0

A `ready-for-agent` ticket, from branch to the commit the user runs. `/task-flow` decides which
issues reach here; `failures.md` in this folder covers a step that cannot complete.

## Contents

The ticket · Where the tree stands · The standards profiles · Steps: 3 route the standards,
4 implement, 5 judge the branch, 6 triage, 7 docs, 8 handoff

**Start this in an empty session** — every turn of this flow re-reads whatever the conversation
already holds. **Invoked with history behind it — say so, and ask for `/clear` before going on.**

**This context writes the code and nothing else.** Judging happens in `/verify-branch`.

## The ticket

!`.claude/bin/ticket-context.sh $0`

## Where the tree stands

!`echo "branch: $(git branch --show-current)  |  HEAD: $(git log --oneline -1)"; echo "--- uncommitted ---"; git status --short | head -20; echo "--- prior state for this ticket ---"; if [ -s .scratch/$0.md ]; then head -40 .scratch/$0.md; else echo "(none — fresh start)"; fi; echo "--- test layout ---"; ls tests 2>/dev/null`

## The standards profiles

!`.claude/bin/standards.sh --list`

**These three blocks are the orientation.** Do not re-run `git status`, `git branch`, `git log`,
`ls tests` or `gh issue view` to learn what they already say.

**A `.scratch/$0.md` with content means a previous session got partway.** Resume from where it
stopped; `failures.md` covers the abandoned case.

## Steps

| # | Step | Where |
| --- | --- | --- |
| 1–2 | Act on `SPEC:` and run the `BRANCH:` command above | here |
| 3 | Route the standards this task touches | here |
| 4 | Implement test-first, record the decisions | `/mattpocock-skills:tdd` |
| 5 | Judge the branch, when it earns it | `/verify-branch $0 full` |
| 6 | Triage and fix | here |
| 7 | `/docs-sync`, when the branch earns it | here |
| 8 | Full gate, propose a commit title, stop | `docs/git-workflow.md` |

### 3 — route the standards

**Name the profiles from the block above, per slice. Reading them is the slice's business** — it
runs `.claude/bin/standards.sh <profile...>` itself and pays one turn for its whole set.

- **Route by the files the code will touch**, not by the issue's `area` label — a frontend ticket
  that adds a login form touches `server` too.
- **`design` only when a surface has to be invented** — a new page with no mock.
- **A doc outside the profiles goes in by path**, named in the slice's prompt.

**Run `standards.sh` here only when step 4 keeps the slices in this context.** A doc opened here is
carried by every turn that follows it, and the ticket it serves is finished long before this context
is.

### 4 — implement

**Invoke `/mattpocock-skills:tdd` before the first test** — it is a Skill call, not a loop to
imitate. It gives: one seam, one failing test, one implementation, next slice, against the seams the
spec settled. Confirm the seams with the user before the first test where the spec left them open.

**Cut the ticket into slices by output size and shared standards, not one slice per seam.** A slice
is roughly 300–500 lines of delivered code, or one profile's worth of files. Each subagent pays a
cold context's whole entry price before it reads a line, so five thin slices cost more than three
full ones — and every extra seam between slices is a wire nobody owns (#66).

**One or two slices — they run here.** There is no third subagent to carry the standards instead, so
run `standards.sh` per step 3 and write the code in this context.

**A ticket that touches one file skips the ledger** — no `.scratch/$0.md`, no wiring pass. Both carry
facts between contexts, and a single file crosses no seam and hands nothing on. Step 8 reports from
what this context did. **Judge it by the files the code actually touched, not by the ticket's
estimate**; the moment a second file is written, the ledger rules below apply from that point on.

**Three or more — every slice runs in a fresh subagent, starting with the first.** A slice kept here
is paid for again on every turn that follows it. **This context then runs `standards.sh` not at all**
— it dispatches, collects six lines, and keeps the ledger.

**Invoking this skill is the request for those subagents.** A standing instruction to spawn none
unless asked is answered here: the user asked, by name, when they typed `/implement-issue`.

**Pick the agent on what the slice decides:**

- **`subagent_type: slice`** where the slice settles something — access control, the server/client
  boundary, a token-contract call, a public seam other slices build on.
- **`subagent_type: slice-fill`** where the shape is already settled and the slice fills it in —
  routes and layouts, placeholder pages, re-exports, a catalog entry per string. It runs cheaper and
  thinks less, which is right for work with nothing left to decide.

**The subagent's prompt carries five things and no more**: the seam, the acceptance criteria that
seam serves, the `standards.sh` profile names from step 3, the `FILES`/`DECIDED` lines already in
`.scratch/$0.md`, and any doc outside the profiles, by path. **The six lines it returns, the hook,
and the template loop are in its own definition** — do not restate them.

**Append `FILES`, `SEAM` and `DECIDED` to `.scratch/$0.md` as each slice returns**, and carry
nothing else forward.

**After the last slice, dispatch one `subagent_type: wiring`** — give it the path
`.scratch/$0.md` and the acceptance criteria, nothing else. It reports which seam no file consumes
and which criterion no `FILES` line covers: a prop published and never passed, or a criterion no
slice owned. That is what splitting a ticket produces and what no gate catches — the code compiles,
the tests pass, and the button does nothing. This context decides what to fix.

**A ticket whose deliverable runs nothing — a skill file, a doc, a config — is built without a
test.** Vitest has no seam to grab, and a test asserting on the file's own wording pins the wording
and proves nothing. Write the line saying so to `.scratch/$0.md` under `## Decisions`; the
acceptance criteria at step 5 verify this class of ticket.

**Write `.scratch/$0.md` twice and no more** — once when the code is done, carrying the profiles
routed under `## Read` and, under `## Decisions`, one line per decision: what was chosen, and what
was rejected where a reviewer would plausibly propose it back. Once more when step 5 returns,
carrying its report. **Each write is a full turn**, and the file exists so the handoff reports from
record rather than from memory, not to narrate progress.

### 5 — judge the branch, when it earns it

**Ask first, in one command:**

```sh
.claude/bin/judge-needed.sh
```

**`JUDGE: skip` ends this step.** The branch touched only helpers, constants, tests, docs or config
— what can be wrong there, the gate and the tests already catch. Run section 8's gate now instead,
give the acceptance verdicts straight from the diff, and record the step as skipped with the reason
the script printed. **A judging round costs a fork's whole entry price before it reads a line**, so
one that cannot find anything is the most expensive nothing in this flow.

**`JUDGE: run` — `/verify-branch $0 full`.** One round: the gate, the ticket's requirements, the
review axes the diff earns, and a verdict per acceptance criterion.

**`/verify-branch $0 recheck` only when step 6 changed code**, and never a third round. It re-runs
the gate and the axes that found something. What is still open goes into an issue comment as known
debt, in the shape `docs/agents/issue-tracker.md` fixes.

**A round returns a terse report.** **Append it to `.scratch/$0.md` as it arrives.**

### 6 — triage

Decide here; reach for the user only at the end:

- **A gate failure is always fixed**, never raised.
- **A finding must name the rule it breaks**, per `docs/agents/coding-standards/review-boundaries.md`.
  One that argues from taste is dropped with a line in the report, and is owed no counter-argument.
- **Open the named doc and read the named line before accepting a finding.** A citation that does
  not say what the finding claims makes it taste. Judge what survives against the standards routed
  at step 3 and the decisions recorded at step 4, then fix what holds.
- **A fix that reaches outside the ticket goes to the user, not into the branch** — one touching
  files the ticket did not, or changing behavior the spec settled. Ask with the finding, both
  options, and a recommendation.
- **Ask when the call is genuinely open**, both readings defensible. Everything under `ASK` in the
  round's report is already one of these.

### 7 — docs

**`/docs-sync` only when the branch changed behavior, architecture or scope** — a new module, a
route, a config, a feature, a standard. A ticket that adds one internal helper and its tests skips
this step and says so in the report. Its deletion pass runs over anything written here.

### 8 — handoff

```sh
.claude/bin/gate.sh $0 full
```

One last time, over code and docs together. **It skips itself when nothing moved since its last
green run**, and on red it prints the head of every failed log — read none of them back.

Then the report, **assembled from `.scratch/$0.md` rather than from memory**: the standards routed,
what the gates and the axes found, which axes were skipped and why, what was fixed, what was
rejected and why, what `/docs-sync` cut, and the acceptance verdict per criterion.

**A step with no line in `.scratch/$0.md` is reported as unrecorded, not reconstructed.** Say which
steps are missing and hand over anyway; the user decides whether to re-run them. **A one-file ticket
reports from this context instead** — step 4 gave it no ledger to read, and nothing is unrecorded.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.
