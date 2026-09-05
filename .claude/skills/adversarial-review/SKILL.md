---
name: adversarial-review
description: A hostile second opinion over a branch, carried by three personas who each try to break it — the Saboteur, the New Hire, the Maintainer at 3 a.m. Overlaps the review axes on purpose. Proves each finding by probe, then restores the branch. /adversarial-review [range]; implement-issue step 6.5.
argument-hint: "[range]"
context: fork
agent: general-purpose
background: false
model: opus
effort: medium
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Adversarial review over `$0`

**Run the review below now and report what it finds.** Ask nothing. **Edits are probes, and section
9 governs every one of them** — the branch is handed over uncommitted, so nothing here restores
itself.

## Contents

1. What this is 2. Gate 3. Read the full file 4. The self-review trap 5. The bar every finding
clears 6. The three personas 7. Severity and promotion 8. Report 9. Probes, and putting the branch
back

**The range is `$0`, or `dev` when `$0` is empty.**

**`dev`, not `dev...HEAD`.** `/implement-issue` hands the branch over uncommitted, so a three-dot
range compares two commits and reports an empty diff over a branch full of work.

**`docs/agents/coding-standards/review-boundaries.md` decides what may be reported at all** — read
it before reporting anything.

## 1. What this is

The second opinion asked for **after** the review axes came back clean and something still feels
wrong. `/implement-issue` runs it once at step 6.5, between triage and `/docs-sync`, unless its
second argument is `false`; the maintainer starts any further round by name. **`/verify-branch`
never carries it as an axis** — an axis cites a rule, and this run attacks the assumption the rule
rests on.

**Overlap with `/bug-hunt-review`, `/payload-security-review` and the standards axis is deliberate.
Report a finding those axes own** — they did not find it, and this run did.

**A persona reports whatever it breaks**: a race, a missing access check, a name that lies, a
migration that cannot roll back. The persona is a way of looking, not a subject.

## 2. Gate — is there anything to break?

```sh
git diff --name-only <range> -- . ':!src/app/(payload)/**' ':!src/payload-types.ts' ':!**/migrations/**/*.json' ':!yarn.lock'
```

Those four are generated. Everything else is in scope — `src/`, `tests/`, `docs/`, config,
migrations, `.claude/`.

**Nothing left, or nothing but `docs/` and `.claude/`** — prose has no input to feed and no state to
leave behind. **Report `CLEAN — nothing executable in range` in one line and stop.**

## 3. Read the full file, judge the changed lines

Read every changed file whole, plus each file that calls into it (`grep` the export name). A hunk
hides the seam between new code and old, which is where these three personas earn their run.

**Read the standards the changed files earn**: `.claude/bin/standards.sh --list` names the profiles,
`.claude/bin/standards.sh <profile...>` prints them — the second call is the one that lets a finding
cite a doc and line, which section 5 requires. Add `docs/features/<slug>.md` where one matching them
exists; that doc is the standing contract, so code disagreeing with it is a finding.

**Report on lines this range changed**, and on a line the range left alone only where the change
made it reachable or made it wrong.

## 4. The self-review trap

The weights that wrote this code are the ones judging it, so it will look correct because it matches
what you expect. Every persona applies these four habits:

1. **Read the file bottom-up.** Start at the last export and work backward.
2. **State each function's contract from its name and signature**, then read the body and say
   whether it honors what you just stated.
3. **Assume every value is `null` and every external call fails** until the code proves otherwise.
4. **Ask what would break if the change were deleted entirely.** "Nothing" is itself a finding.

## 5. The bar every finding clears

**The scenario is reachable today** — a real path through a URL, a click, a request, a deploy, or a
database state a User can produce. A **public contract** is the exception: an exported function, a
Server Action or a route handler is reviewable against a caller written elsewhere.

**Each finding carries what `review-boundaries.md` demands of its kind** — the doc and line, the
failing input and wrong output, or the request that exploits it.

**Where the claim is about behavior, prove it with a probe** (section 9) and report what the
compiler or the runner actually printed — reasoning already passed once, in the axes this run
follows.

**One finding per root cause**, named at the cause. Five symptoms of one bug are one row.

**"No test covers this" is not a finding.** Where a breaking input exists, the finding stands on
that input alone.

## 6. The three personas

**Three separate passes over the same diff, in order.** A pass carrying all three mindsets at once
carries none of them.

### Saboteur — "I am trying to break this in production"

You have the deployed app, a browser, an account, and time. Find the input, the timing or the
sequence that makes it misbehave.

- What is the worst input this accepts? Empty, one, many, zero, negative, very long, wrong type,
  another User's ID.
- What if this runs twice? Concurrently? Never? Half-way, then the process dies?
- What if Payload, Neon, Better Auth or the browser times out, or returns something unexpected?
- Which error path swallows the failure, or returns a default that reads as success?
- What is never released — a subscription, a listener, a connection, a lock?

### New Hire — "I joined this week and must change this in six months"

You have no context beyond the repo. Read the diff cold.

- Does the name say what it does? Does the body do only that?
- How many files must you open to follow one path end to end?
- Which magic number or bare string should have been named (`src/constants/`,
  `docs/agents/coding-standards/abstraction.md`)?
- What did the author know that the reader will not?
- Where does this disagree with the surrounding code, `docs/agents/coding-standards/layers.md`, or
  the feature doc?

### Maintainer at 3 a.m. — "production is broken and I have the logs"

You were woken up. You cannot reproduce it. All you have is what this code left behind.

- When this fails, is what the operator sees enough to locate the cause?
- Can the failure be told apart from success, or does it look fine and do nothing?
- Is the state left behind recoverable? Can a half-finished write be repeated safely?
- What does rollback do — the deploy, the migration (`docs/database-migrations.md`), the optimistic
  update?
- **What does this do to rows that already exist?** A required field with no default, a renamed
  column, a narrowed set of values, a new access rule — each is fine against an empty database and
  each can leave live records unreadable, invalid or invisible to their own author.

### The mandate

**Each persona ends with a finding that clears section 5, or with exactly one `assumption`** — the
single most fragile thing the code relies on, in one line, under its own heading and never in the
findings table.

An `assumption` names no broken rule, blocks nothing, and is never promoted. It exists so that "I
found nothing" is never a persona's whole answer.

## 7. Severity and promotion

| Severity | What lands here |
| --- | --- |
| `high` | A User sees wrong data, an action silently did not happen, or an attacker reaches something they must not. |
| `medium` | The code breaks on an edge input, an error is swallowed, state diverges after an interaction, or a failure is unrecoverable without shell access. |
| `low` | Everything else. |

An action that looks successful and did not occur is `high` — a User never sees it. A thrown error
screen is `medium`.

**A finding raised by two or more personas is merged into one row, then promoted one level**, and
the report names which personas raised it. `high` is the ceiling.

## 8. Report

A markdown table, most severe first. Each finding carries: the file and line, one sentence on what
breaks, the rule it breaks, the persona or personas who raised it, and the concrete fix.

Under the table, one `assumption` line per persona, then the verdict:

- **BLOCK** — one or more `high` findings.
- **CONCERNS** — no `high`, two or more `medium`.
- **CLEAN** — everything else. **`CLEAN` with three assumptions is a complete answer.**

Close with the overall risk and the single thing to fix first. No preamble, no restatement of the
diff, no account of what you read on the way.

## 9. Probes, and putting the branch back

A probe is a deliberate, temporary edit that makes the code answer a question: does this actually
compile, does this test actually fail when the code is wrong, does this prop actually reach the DOM.
It is the only writing allowed here.

**The three that earn their cost:**

- **`@ts-expect-error` on a line you claim is unchecked**, then `yarn typecheck`. `TS2578: Unused
  '@ts-expect-error'` proves the line was never checked and the guarantee is imaginary.
- **Break the implementation, run its test.** A test that stays green over broken code asserts
  nothing, and that is the finding — reported against the test, not the code.
- **Delete the change and run the suite.** Still green means the change is dead or uncovered.

### Putting the branch back

**The branch is uncommitted.** There is no commit to restore from, so `git checkout --`,
`git stash` and `git restore` destroy the author's work rather than your probe. **Never run them.**

**Fingerprint first, probe, restore, prove it:**

```sh
mkdir -p .scratch/probe
git diff <range> | shasum                                   # before the first probe
cp <file> ".scratch/probe/$(echo <file> | tr / _)"          # before editing that file
# … probe, then `cp` the copy back over the original …
git diff <range> | shasum                                   # must equal the first
```

**A mismatched fingerprint is the only thing that stops this run.** Report it as the first line of
the report, name the files, and let the caller repair the branch — do not attempt a second
restoration on top of a failed one.

**Restore after each probe, not at the end.** One probe left in place makes the next probe's result
a lie, and a run that dies mid-way leaves less behind.

**The `PostToolUse` hook runs the covering test on every probe edit and hands back what failed** —
that output is the proof, so read it instead of running `yarn vitest` a second time. Silence from
the hook on a broken implementation is itself the finding.
