---
name: implement-issue
description: Implement a ready-for-agent tracker issue from branch to commit handoff — standards routed, test-first slices in subagents, a judging round, triage, docs sync. /implement-issue <n>; dispatched by task-flow.
argument-hint: "[issue-number] [adversarial: true|false, default true]"
model: opus
effort: medium
allowed-tools: Bash(gh issue view:*), Bash(gh issue comment:*), Bash(git checkout:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*), Bash(.claude/bin/standards.sh:*), Bash(.claude/bin/judge-needed.sh), Bash(.claude/bin/gate.sh:*)
---

# Implement issue #$0

A `ready-for-agent` ticket, from branch to the commit the user runs. `/task-flow` decides which
issues reach here; `failures.md` in this folder covers a step that cannot complete.

## Contents

The ticket · Where the tree stands · The standards profiles · Steps: 3 route the standards,
4 implement, 5 judge the branch, 5.5 see it in a browser, 6 triage, 6.5 adversarial review,
7 docs, 8 handoff

**Start this in an empty session** — every turn of this flow re-reads whatever the conversation
already holds. **Invoked with history behind it — say so, and ask for `/clear` before going on.**

**This context writes the code and nothing else.** Judging happens in `/verify-branch`.

## The ticket

!`.claude/bin/ticket-context.sh $0`

## Where the tree stands

!`echo "branch: $(git branch --show-current)  |  HEAD: $(git log --oneline -1)"; echo "--- uncommitted ---"; git status --short | head -20; echo "--- prior state for this ticket ---"; if [ -d .scratch/$0 ]; then ls .scratch/$0; echo; head -40 .scratch/$0/log.md 2>/dev/null; else echo "(none — fresh start)"; fi; echo "--- test layout ---"; ls tests 2>/dev/null`

## The standards profiles

!`.claude/bin/standards.sh --list`

**These three blocks are the orientation.** Do not re-run `git status`, `git branch`, `git log`,
`ls tests` or `gh issue view` to learn what they already say.

**A `.scratch/$0/` with content means a previous session got partway.** Resume from where it
stopped; `failures.md` covers the abandoned case. **The ledger is a folder** — one file per slice,
written by the slice itself, plus `log.md` for what this context records.

**Nothing is asked before step 8.** The user reads one report and answers every question in it at
once. What would be asked is recorded in `log.md` under `ASK`, the work goes
on under the current code, and the handoff carries the questions.

## Steps

| # | Step | Where |
| --- | --- | --- |
| 1–2 | Act on `SPEC:` and run the `BRANCH:` command above | here |
| 3 | Route the standards this task touches | here |
| 4 | Implement test-first, record the decisions | `/mattpocock-skills:tdd` |
| 5 | Judge the branch, when it earns it | `/verify-branch $0 full` |
| 5.5 | See it in a browser, when the branch drew something | `browser-check` subagent |
| 6 | Triage and fix | here |
| 6.5 | A hostile second opinion, unless `$1` is `false` | `/adversarial-review` |
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

**Count files, not seams.** A ticket that will touch more than ten files is three slices whatever
its seam count says. **Work that iterates against an artifact — render, look, adjust — is a slice
of its own in a subagent, always.**

**A ticket that touches one file skips the ledger** — no `.scratch/$0/`, no wiring pass. Both carry
facts between contexts, and a single file crosses no seam and hands nothing on. Step 8 reports from
what this context did. **Judge it by the files the code actually touched, not by the ticket's
estimate**; the moment a second file is written, the ledger rules below apply from that point on.

**Three or more — every slice runs in a fresh subagent, starting with the first.** A slice kept here
is paid for again on every turn that follows it. **This context then runs `standards.sh` not at all**
— it dispatches, reads six lines back, and keeps `log.md`.

**Invoking this skill is the request for those subagents.** A standing instruction to spawn none
unless asked is answered here: the user asked, by name, when they typed `/implement-issue`.

**Pick the agent on what the slice decides:**

- **`subagent_type: slice`** where the slice settles something — access control, the server/client
  boundary, a token-contract call, a public seam other slices build on.
- **`subagent_type: slice-fill`** where the shape is already settled and the slice fills it in —
  routes and layouts, placeholder pages, re-exports, a catalog entry per string. It runs cheaper and
  thinks less, which is right for work with nothing left to decide.

**The subagent's prompt carries six things and no more**: the seam, the acceptance criteria that
seam serves, the `standards.sh` profile names from step 3, the `FILES`/`DECIDED` lines from the
slice files already in `.scratch/$0/`, any doc outside the profiles by path, and **the ledger path
`.scratch/$0/slice-<n>.md` it writes its own six lines to**. **The six lines it returns, the hook,
and the template loop are in its own definition** — do not restate them.

**The slice writes its own ledger file; this context does not transcribe it.** Read the folder when
a later step needs it — a copy made here is a rephrasing, and step 8 would report from the
rephrasing.

#### Waves, not one long line

**Slices that settle a seam run alone; slices built on a settled seam run together.** Dispatch the
seam-setting `slice` first and by itself — a slice sent in parallel with the one whose `DECIDED` it
needs re-invents that decision instead of reading it, which is how one branch ends up with two
helpers that disagree at the edges. Everything downstream goes out in a single block of `Agent`
calls.

**Files two slices would both touch belong to this context, not to either slice.** Barrel
`index.ts(x)` re-exports, `tests/setup/*`, `package.json`, `.cspell/*`, and every CLI run
(`shadcn add`, `yarn add`) are done here — before dispatch when the slices need the result, after
the last slice when they only feed it. Two agents writing one file race the hook's `git add -N` on
`index.lock`, and a file that misses it is invisible to `gate.sh`'s fingerprint, which then skips a
gate over code it never saw. Each slice reports what its barrel line should be under `SEAM` and
writes none of it.

**After the last slice, dispatch one `subagent_type: wiring`** — give it the folder
`.scratch/$0/` and the acceptance criteria, nothing else. It reports which seam never reached the
consumer its slice named and which criterion no `FILES` line covers: a prop published and never
passed, or a criterion no slice owned. That is what splitting a ticket produces and what no gate catches — the code compiles,
the tests pass, and the button does nothing. This context decides what to fix.

**A ticket whose deliverable runs nothing — a skill file, a doc, a config — is built without a
test.** Vitest has no seam to grab, and a test asserting on the file's own wording pins the wording
and proves nothing. Write the line saying so to `.scratch/$0/log.md` under `## Decisions`; the
acceptance criteria at step 5 verify this class of ticket.

**`.scratch/$0/log.md` is this context's own file, and it takes one block per step that returned a
result** — `## Read` with the profiles routed and any doc taken by path, `## Decisions` for calls
made here rather than in a slice, then one block each from steps 5, 5.5, 6 and 7 as they land.
**Nothing else goes in it.** The file exists so the handoff reports from record rather than from
memory; a block that narrates progress, restates a slice file, or announces what comes next is a
whole turn paid to say nothing, and step 8 reads past it.

### 5 — judge the branch, when it earns it

**Ask first, in one command:**

```sh
.claude/bin/judge-needed.sh
```

**The script decides, not this context.** It is the only thing that may skip this step: run it, read
the first word, do what it says. A green suite is not a reason to skip — the tests this context
wrote check what this context thought to check, which is what a judging round exists to find. Nor is
a small-feeling diff, a careful implementation, or a slice that already reviewed itself. **Skipping
without a printed `JUDGE: skip` is a failure of this step**, and reporting it as skipped when the
script was never run is worse.

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

**A round returns a terse report.** **Append it to `.scratch/$0/log.md` as it arrives.**

**On a split diff, `AXES RUN` reads `launched: …`** — the fork could not wait for its own
subagents, so their findings arrive here, one task notification per axis, after the skill has
returned. **Step 6 starts when the last named axis has landed**, each appended to `log.md`; a step
6 that triages two of three axes triages a branch nobody judged.

### 5.5 — see it in a browser, when the branch drew something

**Dispatch one `subagent_type: browser-check` when the diff touches `src/views/`, `src/app/` or
`src/styles/`.** A green suite is not a look: jsdom has no layout, so a control that renders and
tests clean can still sit at the far edge of its card, animate against nothing, or draw a 16px
target. Give it the acceptance criteria, the URLs to open, and the accessibility categories the
surface owes — it reads `standards.sh ui` itself.

**A surface no route reaches needs a probe page, and this context writes it** — a temporary view
plus its route, removed here before step 8. The agent changes no file.

**Its report is a block in `.scratch/$0/log.md`.** What it measures is fact; whether a measurement
is wrong for this design is this context's call.

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
- **An open call does not stop the flow.** Fix what holds, leave the open call as the code stands,
  run 6.5 through 8, and put the question in the handoff report with both readings and a
  recommendation. A flow that stops to ask at step 6 hands the user a branch with no adversarial
  round, no docs pass and no gate — and the answer, when it comes, reopens every step after it.

### 6.5 — a hostile second opinion

**`$1` is `false` — skip this step and say so in the report.** Anything else, including empty, runs
it. The flag is the user's call on whether the ticket is worth the round, and it is the only thing
that skips this step.

**`/adversarial-review $(git merge-base dev HEAD)`.** Three personas over the branch, each trying to
break it. It overlaps the axes step 5 already ran, on purpose: what it finds is what those axes
looked at and passed.

**One round here. A second is the user's to start by name.**

**Its findings go through step 6, not around it.** The rule that a fix reaching outside the ticket
goes to the user rather than into the branch holds hardest here, because this step is the one that
generates such fixes: a token, a shared primitive, a dependency the ticket never asked about. Fix
what sits inside the ticket, propose the rest as its own issue.

**It probes with temporary edits and restores them.** Its first report line says whether the branch
came back byte-identical; anything else, repair the named files here before triaging a single
finding.

**Append its verdict and what was accepted or rejected to `.scratch/$0/log.md`.**

### 7 — docs

**`/docs-sync` only when the branch changed behavior, architecture or scope** — a new module, a
route, a config, a feature, a standard. A ticket that adds one internal helper and its tests skips
this step and says so in the report. Its deletion pass runs over anything written here.

### 8 — handoff

**A collection changed means a migration in the same branch.** Ask before the gate:

```sh
git diff --name-only $(git merge-base dev HEAD) -- src/collections migrations
```

A file under `src/collections/` with nothing new under `migrations/` — **generate it here and go
on**, with `yarn payload migrate:create <name>`. It is the ticket's own work, not a finding to
raise; `docs/database-migrations.md` has the naming and the rollback proof.

```sh
.claude/bin/gate.sh $0 full
```

One last time, over code and docs together. **It skips itself when nothing moved since its last
green run**, and on red it prints the head of every failed log — read none of them back.

Then the report, **assembled from `.scratch/$0/` rather than from memory** — the slice files and
`log.md` together: the standards routed, what the gates and the axes found, which axes were skipped
and why, what the browser showed, what was fixed, what was rejected and why, what `/docs-sync` cut,
and the acceptance verdict per criterion.

**A step with no block in `.scratch/$0/log.md` is reported as unrecorded, not reconstructed.** Say which
steps are missing and hand over anyway; the user decides whether to re-run them. **A one-file ticket
reports from this context instead** — step 4 gave it no ledger to read, and nothing is unrecorded.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.
