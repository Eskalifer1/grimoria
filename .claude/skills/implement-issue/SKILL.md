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

!`gh issue view $0 --json number,title,state,labels,body,comments --jq '"#\(.number) \(.title)  [\(.state)]\nlabels: \([.labels[].name]|join(", "))\n\n\(.body)\n\n\(([.comments[]|"--- comment by \(.author.login)\n\(.body)"])|join("\n"))"'`

## Steps

| # | Step | Who | Where |
| --- | --- | --- | --- |
| 1 | Confirm the ticket carries a spec | main agent | here |
| 2 | Create the branch | main agent | `docs/git-branching.md` |
| 3 | Read the standards this task touches | main agent | here |
| 4 | Implement test-first, record the decisions | **main agent** | `/mattpocock-skills:tdd` |
| 5 | Fast gate | subagent | `/checks fast` |
| 6 | Self-verify against the requirements, 1–2 rounds | fresh subagent finds, main agent judges | `/self-verify` |
| 7 | Full gate | subagent | `/checks` |
| 8 | Review, over the axes the diff earns | one subagent, or one per axis | here |
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

**Invoke `/mattpocock-skills:tdd` before the first test** — it is a Skill call, not a description of
the loop to imitate; a run that skips it is unrecorded at step 13. It gives: **one seam, one failing
test, one implementation, next slice**, against the seams the spec settled. Confirm the seams with the user before the first test
where the spec left them open.

**A ticket whose deliverable runs nothing — a skill file, a doc, a config — is built without a
test.** Vitest has no seam to grab, and a test asserting on the file's own wording pins the wording
and proves nothing. Write the line saying so to `.scratch/$0.md` under `## Decisions`; the
acceptance criteria at step 11 are what verifies this class of ticket.

**`git add -N` every file the ticket creates, as it is created.** Nothing here is committed until
the user commits, and an untracked file is invisible to `git diff` — step 6 and every axis at step 8
would judge an empty range. **The range they all take is `dev`**, which carries the working tree.

**Record decisions as they are made**, to `.scratch/$0.md` under `## Decisions` — one line each:
what was chosen, and what was rejected where a reviewer would plausibly propose it back. Step 9
reads this file.

### 5 and 7 — the two gates

| Gate | Commands | When |
| --- | --- | --- |
| **Fast** — `/checks fast $0` | `yarn check` → `yarn typecheck` → `yarn spellcheck` → `yarn test` | Step 5, and after every fix in steps 6, 9, 10 |
| **Full** — `/checks full $0` | the fast gate, then `yarn build` | Step 7, and again at step 13 |

**Pass the issue number as the second argument** — it names the gate's log files, so a second branch
gating at the same time cannot overwrite them.

**Every gate in this skill is one `/checks` call and nothing else** — steps 5, 6, 7, 9, 10 and 13
alike. `/checks` forks its own subagent on the cheapest model, so **a `yarn` command typed here
instead pays for its whole output in the main context** — measured at twelve inline runs against one
skill call. **Failures come back verbatim; a green run is one line and nothing else.**

**Red stops the flow**, including a failure that looks unrelated to this ticket. Fix and re-run
until green.

### 6 — self-verify

`/self-verify $0` over the branch range. It runs the rounds, and the fast gate after any round that
fixed something.

**This is the only step that judges the code against the ticket.** Step 8 judges it against the
standards.

### 8 — review

**An axis costs the same whether or not the diff can break its rules.** A subagent pays its whole
context to open a range it will find nothing in — measured at four axes over a 40-line pure
function, two of which were no-ops before they started. So the diff picks the axes, and the diff's
size picks how they are carried.

**One command decides both**, and it is the only input needed:

```sh
git diff --stat dev && git diff --name-only dev
```

#### Which axes run

| Axis | File the subagent reads | Runs when the changed files include |
| --- | --- | --- |
| Standards + Fowler smells | `~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/code-review/SKILL.md`, **its Standards axis alone** | always |
| bug hunt | `.claude/skills/bug-hunt-review/SKILL.md` | always |
| a11y | `.claude/skills/a11y-review/SKILL.md` | a `.tsx` file that renders markup a User reaches — `src/views/`, `src/features/`, `src/entities/`, `src/shared/components/`, `src/app/(frontend)/` — or a `messages/` catalog whose copy carries markup |
| Payload access control | `.claude/skills/payload-security-review/SKILL.md` | `src/collections/`, `src/payload.config.ts`, `src/proxy.ts`, any `route.ts`, any Server Action (`'use server'`), or any new read of User input |

**`src/admin/` and `src/app/(payload)/` do not earn the a11y axis.** The admin is the maintainer's
alone (`docs/features/auth.md`) and the `(payload)` tree is vendored — neither is a surface this
repo holds an accessibility level on.

**A skipped axis is named in the step-13 report as skipped and why**, so a gap is visible rather
than silent.

#### How they are carried

| Diff | Carrier |
| --- | --- |
| **≤ 5 files and ≤ 150 changed lines** | **one subagent** running the surviving axes in sequence, each from its own file |
| anything larger | **one subagent per surviving axis, launched in one message** so they run in parallel |

Under the small-diff threshold every extra subagent re-reads the same short diff and pays a fresh
context to do it, and the four contexts cost more than the four passes save. Above it the diff is
long enough that a single agent holding four rule sets at once starts missing findings, and the
parallelism buys back the wall clock.

**Every review subagent runs `model: sonnet`.** Applying a rule set to a diff is the work; deciding
which findings survive is step 9, in the main agent, on the stronger model.

**Each subagent is given the exact path of its axis file and told to read it and follow it**, rather
than to invoke the skill. The axis skills fork when invoked, and a fork inside a subagent is a
second hop that relays its findings through a middleman. Forks also queue rather than run at once —
measured — so the parallelism here comes from the subagents and nowhere else.

**A plugin skill lives outside the repo** and its path carries a version segment that moves on every
plugin update, so the standards axis gets a glob and the subagent expands it with `ls` on the first
tool call. Passing `.claude/skills/mattpocock-skills/...` sends it hunting the filesystem — measured,
twice.

Each subagent is given the git range and **nothing about the ticket**. Each axis returns a list, one
entry per finding: severity, file, line, summary, and **the rule it breaks** — the field step 9
triages on.

**`code-review` ships two axes and only its Standards axis runs here.** Say so in its prompt: its
Spec axis reads the ticket, which step 6 already did with the issue in hand, and inside a subagent
its "ask the user where the spec is" fallback has nobody to ask.

**What a review may report at all is `docs/agents/coding-standards/review-boundaries.md`.** The axes
only report; nothing changes until step 9.

`.claude/workflows/review-axes.js` carries the same four axes under a validated JSON schema and is
the better carrier the day a session can launch a workflow. **It is not a slash command** — nothing
runs it today (#66), so the subagents above are the live path.

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

`/checks fast $0` after every fix, `/checks full $0` once the fixes stop, then the review axes again over
the **fix diff** — and **only the axes that returned a finding the first time**. An axis that came
back empty over the wider range comes back empty over a subset of it.

**A fresh subagent, on `model: sonnet`** — an agent cannot resume a run. The fix diff is smaller
than the diff that produced the findings, so this re-run is the small-diff case of step 8: **one
subagent carries every axis being re-run.**

Two full cycles maximum; what is still open goes into an issue comment as known debt.

### 11 — acceptance check

A **fresh** subagent on `model: sonnet` gets the issue with comments and the final diff and returns, under a schema,
one verdict per acceptance criterion: met, not met, or out of scope. Anything not met goes back to
step 9, and the loop re-enters at step 11, not at step 12.

### 12 — docs

`/docs-sync`. Its deletion pass runs over anything written here, and its report folds into step 13.

### 13 — handoff

`/checks full $0` one last time, over code and docs together — **this run is what makes the handoff
green, and a run skipped here hands the user an ungated branch.** Then the report, **assembled from
`.scratch/$0.md` rather than from memory**: the docs read, what the gates and the axes found, what
was fixed, what was rejected and why, what `/docs-sync` cut, and the step-11 verdict per criterion.

Every step from 5 on appends its outcome to that file as it finishes — one or two lines, written at
the time.

**A step with no line in the file is reported as unrecorded, not reconstructed.** Say which steps
are missing and hand over anyway; the user decides whether to re-run them.

Propose a commit title and **stop** — the user runs the commit, and the issue is closed only after
they confirm it landed.
