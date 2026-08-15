---
name: implement-issue
description: Implement a `ready-for-agent` tracker issue from branch to commit handoff — standards routed, test-first slices in their own subagents, a judging round in its own context when the diff earns one, triage, docs sync. Invoked as /implement-issue <issue-number>, and dispatched to by /task-flow for a ready ticket.
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
| 3 | Route the standards this task touches | here |
| 4 | Implement test-first, record the decisions | `/mattpocock-skills:tdd` |
| 5 | Judge the branch, when it earns it | `/verify-branch $0 full` |
| 6 | Triage and fix | here |
| 7 | `/docs-sync`, when the branch earns it | here |
| 8 | Full gate, propose a commit title, stop | `docs/git-workflow.md` |

### 3 — route the standards

**Produce the list of paths, from `CLAUDE.md`'s `## Where to look, by task`. Reading them is step
4's business.**

- **Route by the files the code will touch**, not by the issue's `area` label — a frontend ticket
  that adds a login form touches auth too.
- **Every coding standard covering a changed file, always.**
- **The design docs when a surface has to be invented** — a new page with no mock.

**A doc opened here is carried by every turn that follows it.** The set runs to 40,000 characters,
and the ticket it serves is finished long before this context is. Where step 4 dispatches slices,
each subagent opens only the two or three its own slice touches, and pays for them for the length
of that slice alone.

**Open them here only when step 4 keeps the slices in this context** — three seams or fewer, where
there is no subagent to read them instead. One `cat` for every doc, not one per doc.

### 4 — implement

**Invoke `/mattpocock-skills:tdd` before the first test** — it is a Skill call, not a loop to
imitate. It gives: one seam, one failing test, one implementation, next slice, against the seams the
spec settled. Confirm the seams with the user before the first test where the spec left them open.

**Count the seams before the first test, and let the count decide where the slices run:**

- **Three or fewer — they run here.** A fork costs its whole entry price before it reads a line, and
  three short slices do not earn three of those. Read the standards now, per step 3.
- **More than three — every slice runs in a fresh subagent, starting with the first.** A slice kept
  here is paid for again on every turn that follows it: on a ticket the size of a site shell that is
  the largest single cost in the flow, larger than the code, the gates and the judging together.
  **This context then opens no standards doc at all** — it dispatches, collects five lines, and
  keeps the ledger.

**Invoking this skill is the request for those subagents.** A standing instruction to spawn none
unless asked is answered here: the user asked, by name, when they typed `/implement-issue`.

**Pick the model per slice**, on what the slice actually decides:

- **`opus`** where the slice settles something — access control, the server/client boundary, a
  token-contract call, a public seam other slices will build on.
- **`sonnet`** where the shape is already settled and the slice fills it in — routes and layouts,
  placeholder pages, re-exports, a catalog entry per string.

**The subagent gets five things and no more**: the seam, the acceptance criteria that seam serves,
the standards paths from step 3, the `FILES`/`DECIDED` lines already in `.scratch/$0.md`, and the
line `Write the failing test first; the PostToolUse hook runs Biome, cspell and the covering test on
every file you write.` **It opens only the standards its own seam touches**, not the whole set.

**It returns these six lines and no more**, and say so in its prompt:

```
FILES    <path — created|changed, one per line>
SEAM     <each prop, export, route or message key this slice hands another — name and shape>
DECIDED  <what was chosen, and what was rejected where a reviewer would propose it back>
TESTS    <n passing | the one failure, verbatim>
LEFT     <what this slice deliberately did not do>
ASK      <none | the call it could not settle>
```

**Every turn inside a slice carries a tool call.** A turn spent announcing the next step or
restating the file just written pays for the whole context again to say nothing — measured on a
site-shell ticket, over half of every slice's turns produced no tool call at all. The six lines at
the end are where a slice speaks: no plan, no running commentary, no advice for the next slice.

**Append `FILES`, `SEAM` and `DECIDED` to `.scratch/$0.md` as each slice returns**, and carry
nothing else forward.

**After the last slice, dispatch one `sonnet` wiring pass** — hand it every `SEAM` line collected
and the acceptance criteria, and ask which seam no file consumes and which criterion no `FILES` line
covers. A prop published and never passed, or a criterion no slice owned, is what splitting a ticket
produces and what no gate catches: the code compiles, the tests pass, and the button does nothing.
It reports; this context decides what to fix.

**A ticket whose deliverable runs nothing — a skill file, a doc, a config — is built without a
test.** Vitest has no seam to grab, and a test asserting on the file's own wording pins the wording
and proves nothing. Write the line saying so to `.scratch/$0.md` under `## Decisions`; the
acceptance criteria at step 5 verify this class of ticket.

**Files that differ only by substitution are created by one loop over a template**, in a single
`Bash` call — placeholder pages, route files that re-export a screen module, a catalog entry per
string. **A file with a decision inside it gets its own `Write`.** Twenty-five near-identical
one-file writes cost more than the module they build: each turn pays for the whole context again,
and the template is emitted twenty-five times instead of once.

```sh
for p in Favorites Drafts PublicNotes; do
  mkdir -p "src/views/${p}Page" && cat > "src/views/${p}Page/index.tsx" <<EOF
…the template, with $p substituted…
EOF
done
```

**The loop's files never touch the hook** (`CLAUDE.md`, `## Tooling`). Close it with one
`yarn check --write` over the paths and one `git add -N`, or they reach every gate unformatted and
every diff invisible.

**Write `.scratch/$0.md` twice and no more** — once when the code is done, carrying the docs read
under `## Read` and, under `## Decisions`, one line per decision: what was chosen, and what was
rejected where a reviewer would plausibly propose it back. Once more when step 5 returns, carrying
its report. **Each write is a full turn**, and the file exists so the handoff reports from record
rather than from memory, not to narrate progress.

**Do not run `yarn test` after writing an implementation file** — the hook already ran its covering
test, and silence means green. **Writing the failing test first still costs a run of its own**: the
hook stays quiet on test files, because red is what that step is for.

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
