---
name: implement-issue
description: Implement a `ready-for-agent` tracker issue from branch to commit handoff — standards read, test-first, a judging round in its own context when the diff earns one, triage, docs sync. Invoked as /implement-issue <issue-number>, and dispatched to by /task-flow for a ready ticket.
argument-hint: "[issue-number]"
model: opus
effort: medium
allowed-tools: Bash(gh issue view:*), Bash(gh issue comment:*), Bash(git checkout:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*)
---

# Implement issue #$0

A `ready-for-agent` ticket, from branch to the commit the user runs. `/task-flow` decides which
issues reach here; `failures.md` in this folder covers a step that cannot complete.

**Start this in an empty session** — every turn of this flow re-reads whatever the conversation
already holds. **Invoked with history behind it — say so, and ask for `/clear` before going on.**

**This context writes the code and nothing else.** Judging happens in `/verify-branch`.

## The ticket

!`.claude/bin/ticket-context.sh $0`

## Where the tree stands

!`echo "branch: $(git branch --show-current)  |  HEAD: $(git log --oneline -1)"; echo "--- uncommitted ---"; git status --short | head -20; echo "--- prior state for this ticket ---"; if [ -s .scratch/$0.md ]; then head -40 .scratch/$0.md; else echo "(none — fresh start)"; fi; echo "--- test layout ---"; ls tests 2>/dev/null`

**This block is the orientation.** Do not re-run `git status`, `git branch`, `git log` or
`ls tests` to learn what it already says.

**A `.scratch/$0.md` with content means a previous session got partway.** Resume from where it
stopped; `failures.md` covers the abandoned case.

## Steps

| # | Step | Where |
| --- | --- | --- |
| 1–2 | Act on `SPEC:` and run the `BRANCH:` command above | here |
| 3 | Read the standards this task touches | here |
| 4 | Implement test-first, record the decisions | `/mattpocock-skills:tdd` |
| 5 | Judge the branch, when it earns it | `/verify-branch $0 full` |
| 6 | Triage and fix | here |
| 7 | `/docs-sync`, when the branch earns it | here |
| 8 | Full gate, propose a commit title, stop | `docs/git-workflow.md` |

### 3 — read the standards first

**One `cat` for every doc, not one per doc.**

- **Route by the files the code will touch**, not by the issue's `area` label — a frontend ticket
  that adds a login form touches auth too.
- **Every coding standard covering a changed file, always.**
- **The design docs when a surface has to be invented** — a new page with no mock.

### 4 — implement

**Invoke `/mattpocock-skills:tdd` before the first test** — it is a Skill call, not a loop to
imitate. It gives: one seam, one failing test, one implementation, next slice, against the seams the
spec settled. Confirm the seams with the user before the first test where the spec left them open.

**Past the third slice, each remaining slice runs in a fresh subagent on `model: opus`.** A slice
kept here is paid for again on every turn that follows it, so a long ticket implemented in one
context costs more than the ticket is.

**The subagent gets four things and no more**: the seam, the acceptance criteria that seam serves,
the standards paths from step 3, and the line `Write the failing test first; the PostToolUse hook
runs Biome, cspell and the covering test on every file you write.`

**It returns five lines and no more**, and say so in its prompt:

```
FILES    <path — created|changed, one per line>
DECIDED  <what was chosen, and what was rejected where a reviewer would propose it back>
TESTS    <n passing | the one failure, verbatim>
LEFT     <what this slice deliberately did not do>
ASK      <none | the call it could not settle>
```

**A subagent that narrates its work undoes the reason it exists** — the transcript it saves is paid
for again if it comes back as prose. No plan, no recap of the code, no advice for the next slice.

**Append `FILES` and `DECIDED` to `.scratch/$0.md` as each slice returns**, and carry nothing else
forward.

**A ticket whose deliverable runs nothing — a skill file, a doc, a config — is built without a
test.** Vitest has no seam to grab, and a test asserting on the file's own wording pins the wording
and proves nothing. Write the line saying so to `.scratch/$0.md` under `## Decisions`; the
acceptance criteria at step 5 verify this class of ticket.

**A file created with `Write` is already `git add -N`'d** by the `PostToolUse` hook. **A file
created any other way — a heredoc, `printf`, a generator — is not**; `git add -N` those by hand as
they appear, or the whole new module reads as no change at all to every gate and judging round.

**Write `.scratch/$0.md` twice and no more** — once when the code is done, carrying the docs read
under `## Read` and, under `## Decisions`, one line per decision: what was chosen, and what was
rejected where a reviewer would plausibly propose it back. Once more when step 5 returns, carrying
its report. **Each write is a full turn**, and the file exists so the handoff reports from record
rather than from memory, not to narrate progress.

**A file written is a file already formatted, spell-checked and tested** — a `PostToolUse` hook
runs Biome and cspell on it, and on a file under `src/` with a matching test it runs that test too.
Fix what it hands back. **Do not run `yarn test` after writing an implementation file**; the hook
already did, and silence from it means green.

**Writing the failing test first still costs a run** — the hook stays quiet on test files, because
red is what that step is for.

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
debt.

**A round returns a terse report.** **Append it to `.scratch/$0.md` as it arrives.**

### 6 — triage

Decide here; reach for the user only at the end:

- **A gate failure is always fixed**, never raised.
- **A finding must name the rule it breaks**, per `docs/agents/coding-standards/review-boundaries.md`.
  One that argues from taste is dropped with a line in the report, and is owed no counter-argument.
- **Open the named doc and read the named line before accepting a finding.** A citation that does
  not say what the finding claims makes it taste. Judge what survives against the standards read at
  step 3 and the decisions recorded at step 4, then fix what holds.
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

`/checks full $0` one last time, over code and docs together. **It skips itself when nothing moved
since its last green run.**

Then the report, **assembled from `.scratch/$0.md` rather than from memory**: the docs read, what
the gates and the axes found, which axes were skipped and why, what was fixed, what was rejected and
why, what `/docs-sync` cut, and the acceptance verdict per criterion.

**A step with no line in `.scratch/$0.md` is reported as unrecorded, not reconstructed.** Say which
steps are missing and hand over anyway; the user decides whether to re-run them.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.
