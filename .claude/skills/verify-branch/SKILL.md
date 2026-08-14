---
name: verify-branch
description: Judge a branch someone else wrote — gates, the ticket's requirements, the review axes the diff earns, and on the final round the acceptance criteria. Runs in its own context on a cheaper model, reads code only, and repairs nothing. Invoked as /verify-branch <issue-number> <first|final>, and by /implement-issue at steps 5 and 7.
argument-hint: "[issue-number] [first|final]"
context: fork
agent: general-purpose
background: false
model: sonnet
effort: medium
allowed-tools: Bash, Read, Grep, Glob, Skill, Agent
---

# Judge issue #$0 — `$1` round

**Report what you find and stop. Change no file.** The agent that called this owns every fix.

**Read no `.scratch/` file.** The author's reasoning lives there, and a critic handed the
assumptions the code came from reproduces them and calls the result correct. The ticket, the diff
and the repo are the whole input.

**The range is `dev`, not `dev...HEAD`** — nothing on this branch is committed, so a three-dot range
reports an empty diff over a branch full of work.

## 1. The diff, the delta and the axes

!`.claude/bin/review-context.sh $0 $1`

**That block is the whole input and it cost no turn.** It carries the diff, how far the branch moved
since the previous round, which axes the changed files earn, and the full text of exactly those
axes. **Do not re-run `git diff`, expand the plugin path, or open an axis file** — it is above.

**An empty file list is a broken call, not a clean branch.** Say the range came back empty and stop.

**Report a suspiciously thin diff rather than judging it** — a file never `git add -N`'d is
invisible here, and a whole new module then reads as no change at all.

## 2. What the round covers

| | `first` | `final` |
| --- | --- | --- |
| Gate | `/checks fast $0` | `/checks full $0` |
| Requirements against the ticket | yes | yes, over the fixed diff |
| Review axes | every axis `RUN:` names | see the two rules below |
| Acceptance criteria, one verdict each | no | yes |

**The `final` round runs only the axes that returned a finding in the `first` round** — an axis
empty over the wider diff is empty over a subset of it.

**A `final` round whose `DELTA` is under 20 lines runs no axis at all**: gate, requirements and
acceptance only. Say so under `AXES SKIPPED` with the delta. Fixes that small cannot introduce what
four rule sets just came back clean on.

## 3. Gate

`/checks fast $0` on the `first` round, `/checks full $0` on the `final` one. It skips itself when
the branch has not moved since its last green run.

**Red stops this skill.** Report the failure verbatim and return.

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

**`RUN:` in section 1 is the list. Follow each named axis from the text already printed there**, and
report every `SKIPPED:` axis as skipped, with the reason given.

**Carry the axes yourself, in sequence, when the diff is ≤ 5 files and ≤ 150 changed lines.** Above
that, **one `subagent_type: review-axis` per axis, launched in one message** so they run in
parallel — a single pass holding four rule sets at once starts dropping findings at that size. Hand
each one the axis file path and the range; it re-reads its own axis.

**Of the standards axis, only its Standards half runs here.** Its Spec axis reads the ticket, which
section 4 already did, and inside a fork its "ask the user where the spec is" fallback has nobody to
ask.

**`docs/agents/coding-standards/review-boundaries.md`, printed in section 1, decides what may be
reported at all.** A finding names the rule it breaks, by doc and line, or it is taste and does not
travel.

## 6. Acceptance — `final` round only

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
