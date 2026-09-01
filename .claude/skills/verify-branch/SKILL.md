---
name: verify-branch
description: Judge a branch someone else wrote — the full gate, the ticket's requirements, the review axes the diff earns, one verdict per acceptance criterion. Reads only. /verify-branch <n> <full|recheck>; implement-issue step 5.
argument-hint: "[issue-number] [full|recheck]"
context: fork
agent: general-purpose
background: false
model: sonnet
effort: medium
allowed-tools: Bash, Read, Grep, Glob, Agent
---

# Judge issue #$0 — `$1` round

## Contents

1. Where the branch stands 2. What the round covers 3. Gate 4. Requirements 5. Review axes
6. Acceptance 7. Report — then the appendix of axes `RUN:` names

**Report what you find and stop. Change no file** except the one gate-fingerprint line in section 3.
The agent that called this owns every fix.

**Read no `.scratch/` file the author wrote** — `$0.md` above all. The author's reasoning lives
there, and a critic handed the assumptions the code came from reproduces them and calls the result
correct. The ticket, the diff and the repo are the whole input. The three files this skill's own
tooling writes — `verify-$0.diff`, `axes-$0.md`, `checks-$0-*.log` — are that input, not the
author's word for it.

## 1. Where the branch stands

!`.claude/bin/review-context.sh $0 $1 head`

**That block is the shape of the diff, and it cost no turn. Do not run `git diff`, `git status` or
`git log`** — the range is already `dev` rather than `dev...HEAD`, which would report an empty diff
over a branch nothing has committed yet.

**The diff itself is at `.scratch/verify-$0.diff`, already written. Read it once, whole,** with the
Read tool. Walking it in `sed` windows pays for the file as many times as there are windows, and a
finding needs the file it lives in anyway.

**An empty file list is a broken call, not a clean branch.** Say the range came back empty and stop.

**Report a suspiciously thin diff rather than judging it** — a file never `git add -N`'d is
invisible here, and a whole new module then reads as no change at all.

## 2. What the round covers

**`full` is the whole judgement and runs once**: the gate, the requirements, every axis `RUN:`
names, and one verdict per acceptance criterion.

**`recheck` runs only after a `full` round whose findings changed code.** It covers the gate, the
acceptance criteria, and **only the axes that returned a finding the first time** — an axis empty
over the wider diff is empty over a subset of it.

**A `recheck` whose `DELTA` is under 20 lines runs no axis at all**: gate and acceptance only. Say
so under `AXES SKIPPED` with the delta. Fixes that small cannot introduce what four rule sets just
came back clean on.

## 3. Gate

**Section 1 already ran the checks this section would open with. Do not list `.scratch/`, re-read
`gate-$0.now`, or confirm any line it printed** — it is the tool's own output, not a claim to test.

**`GATE: skip` means the branch has not moved since its last green run.** Report
`full gate: green, inputs unchanged` and go to section 4 without running anything.

**On `GATE: run`, this one command:**

```sh
.claude/bin/gate.sh $0 full
```

It runs all five gates even after one goes red, records the green fingerprint, and on red prints the
first 60 lines of every failed log itself. **Read no `.scratch/checks-$0-*.log` back** — the script
already printed what a `Read` would find, and the logs stay on disk for the caller.

**Red stops this skill.** Report what the script printed, verbatim. Judging code that does not
compile wastes both of us.

## 4. Requirements

**A divergence is a requirement of the ticket that the code does not meet, meets differently, or
meets more widely than it was asked to.** All three, including the third.

Gather the ticket with the `--json`/`--jq` form — **never `gh issue view --comments`, which prints
nothing at all when the issue has no comments**:

```sh
gh issue view $0 --json number,title,body,comments --jq '"\(.title)\n\n\(.body)\n\n\(([.comments[]|.body])|join("\n---\n"))"'
```

Style, naming, layering, duplication, accessibility, access control and latent bugs are **not**
divergences — section 5 pays for those. Each divergence carries the file and line, the requirement,
what stands in the code instead, and which of the three kinds it is.

## 5. Review axes

**`RUN:` in section 1 is the list, and the appendix at the bottom of this file is either their full
text or their paths.** Follow each named axis. **Open no other standards doc to invent an axis of
your own** — an axis absent from `RUN:` is one the diff cannot break, and it is reported as skipped
with the reason section 1 gave.

**`SPLIT:` in section 1 decides where they run, and it has already counted the diff:**

- **`SPLIT: no` — carry the axes yourself, in sequence,** from the appendix text below.
- **`SPLIT: yes` — one `subagent_type: review-axis` per axis, all launched in one message** so they
  run in parallel. A single pass holding four rule sets at once starts dropping findings at that
  size. Hand each one the axis path the appendix prints and the range; it re-reads its own axis.
  **The appendix then prints paths and no text, so read nothing from it yourself.**

**Invoking this skill is the request for those subagents.** A standing instruction to spawn none
unless asked is answered here: the round was asked for by name, and a diff this size judged in one
pass returns fewer findings than it should.

**`review-boundaries.md`, first in the appendix, decides what may be reported at all.** A finding
names the rule it breaks, by doc and line, or it is taste and does not travel.

## 6. Acceptance

One verdict per acceptance criterion in the ticket: **met, not met, or out of scope.** Quote the
criterion, name the file and line that meets it, and say plainly which of the three it is.

## 7. Report

**Terse. This report is read inside another agent's context, and every word is paid for there.**

```
GATE     <level>: green | red — <command>, then the log's first 60 lines verbatim>
DIVERGE  <none> | <file:line — requirement — what stands instead — misses|differs|exceeds>
AXES RUN <axis: n findings, ...>   AXES SKIPPED <axis: reason, ...>
FINDING  <severity — file:line — rule, by doc and line — one-sentence claim>
ACCEPT   <criterion — met|not met|out of scope — file:line>
ASK      <the call that is genuinely open, both readings, and a recommendation>
```

**`ASK` is how this skill reaches the user** — it cannot ask anything itself. A fix that reaches
outside the ticket, or a genuinely open call, goes there instead of into a finding.

**A section with nothing to say is one word: `none`.** No preamble, no restatement of the ticket, no
account of what you read on the way.

## Appendix — the axes `RUN:` named

**Below is one of three things**, and it says which: the axes themselves; one file holding them all,
because the set was too long to sit inline — read it once, in full; or, on `SPLIT: yes`, the axis
paths alone, which you hand to the subagents and do not open.

!`.claude/bin/review-context.sh $0 $1 axes`
