---
name: verify-branch
description: Judge a branch someone else wrote — gates, the ticket's requirements, the review axes the diff earns, and on the final round the acceptance criteria. Runs in its own context on a cheaper model, reads code only, and repairs nothing. Invoked as /verify-branch <issue-number> <first|final>, and by /implement-issue at steps 5–8 and 10–11.
argument-hint: "[issue-number] [first|final]"
context: fork
agent: general-purpose
background: false
model: sonnet
allowed-tools: Bash, Read, Grep, Glob, Skill, Agent
---

# Judge issue #$0 — `$1` round

**Report what you find and stop. Change no file.** The agent that called this owns every fix.

**This runs in its own context so the author's reasoning cannot reach it.** An agent is blind to
exactly the assumptions it generated the code from, so a critic handed those assumptions reproduces
them and calls the result correct. **Read no `.scratch/` file** — that is where the author's
reasoning lives. The ticket, the diff, and the repo are the whole input.

**The range is `dev`, not `dev...HEAD`.** `/implement-issue` commits nothing, so a three-dot range
compares two commits and reports an empty diff over a branch full of work.

## 1. What the round covers

| | `first` | `final` |
| --- | --- | --- |
| Gate | `/checks fast $0` | `/checks full $0` |
| Requirements against the ticket | yes | yes, over the fixed diff |
| Review axes | every axis the diff earns | only the axes that returned a finding in the `first` round |
| Acceptance criteria, one verdict each | no | yes |

**An axis that came back empty over the wider diff comes back empty over a subset of it**, so the
`final` round never re-runs a clean axis.

## 2. The diff decides everything below

```sh
git diff --stat dev && git diff --name-only dev
```

**An empty diff is a broken call, not a clean branch.** Say the range came back empty and stop.

**A file never `git add -N`'d is invisible here**, and a whole new module then reads as no change at
all. Report a suspiciously thin diff rather than judging it.

## 3. Gate

`/checks fast $0` on the `first` round, `/checks full $0` on the `final` one. It skips itself when
the branch has not moved since its last green run, so calling it costs nothing when nothing changed.

**Red stops this skill.** Report the failure verbatim and return — judging code that does not
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

**An axis costs the same whether or not the diff can break its rules**, so the changed files pick
which ones run.

| Axis | File to read and follow | Runs when the changed files include |
| --- | --- | --- |
| Standards + Fowler smells | `~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/code-review/SKILL.md`, **its Standards axis alone** | always |
| bug hunt | `.claude/skills/bug-hunt-review/SKILL.md` | always |
| a11y | `.claude/skills/a11y-review/SKILL.md` | a `.tsx` under `src/views/`, `src/features/`, `src/entities/`, `src/shared/components/` or `src/app/(frontend)/`, or a `messages/` catalog whose copy carries markup |
| Payload access control | `.claude/skills/payload-security-review/SKILL.md` | `src/collections/`, `src/payload.config.ts`, `src/proxy.ts`, any `route.ts`, any `'use server'`, or any new read of User input |

**The standards axis path carries a `*`** — it is a plugin outside the repo whose version segment
moves on every update. Expand it with one `ls`; a guessed path sends you hunting the filesystem.

**Read the axis file and follow it. Do not invoke the skill** — the axis skills fork when invoked,
and a fork here is a second hop relaying findings through a middleman.

**Carry the axes yourself, in sequence, when the diff is ≤ 5 files and ≤ 150 changed lines.** Above
that, **one subagent per axis on `model: sonnet`, launched in one message** so they run in parallel:
past that size a single pass holding four rule sets at once starts dropping findings, and the
parallelism buys back the wall clock. Below it, four contexts re-reading one short diff cost more
than the four passes save.

**`code-review` ships two axes and only its Standards axis runs here.** Say so in its prompt: its
Spec axis reads the ticket, which section 4 already did, and inside a fork its "ask the user where
the spec is" fallback has nobody to ask.

**What a review may report at all is `docs/agents/coding-standards/review-boundaries.md`.** Read it
before reporting anything. A finding names the rule it breaks, by doc and line, or it is taste and
does not travel.

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
