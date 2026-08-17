---
name: implement-issue-simple
description: Implement a small, low-risk change end to end — branch, code, gate, commit title — with no slices, no judging round and no review axes. For a mechanical sweep across many files, a copy fix, a config bump, a rename, or a one-file change whose blast radius the user already knows. Invoked as /implement-issue-simple [issue-number].
argument-hint: "[issue-number]"
model: sonnet
effort: medium
allowed-tools: Bash(gh issue view:*), Bash(git checkout:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(.claude/bin/standards.sh:*), Bash(.claude/bin/gate.sh:*), Read, Write, Edit, Grep, Glob
---

# Implement #$0, the simple path

A change whose blast radius the user already knows. **`/implement-issue` is the flow for everything
else** — a ticket carrying a spec, a seam other work builds on, or a diff someone should judge.

## The ticket

!`if [ -n "$0" ]; then gh issue view "$0" --json number,title,state,body,labels --template '#{{.number}} {{.title}}  [{{.state}}]{{"\n"}}labels: {{range .labels}}{{.name}} {{end}}{{"\n\n"}}{{.body}}' 2>/dev/null || echo "(gh could not fetch #$0 — the request in this conversation is the spec)"; else echo "(no issue number — the request in this conversation is the spec)"; fi`

## Where the tree stands

!`echo "branch: $(git branch --show-current)  |  HEAD: $(git log --oneline -1)"; echo "--- uncommitted ---"; git status --short | head -20`

## The standards profiles

!`.claude/bin/standards.sh --list`

**These three blocks are the orientation.** Do not re-run `git status`, `git branch`, `git log` or
`gh issue view` to learn what they already say.

## 1 — confirm it is simple

**Hand the task to `/implement-issue` and stop** when it reaches any of these:

- `src/collections/**`, `src/payload.config.ts`, any `route.ts`, a Server Action, `scripts/**` — who
  may do what is `docs/features/auth.md`, and a diff touching it earns a judging round.
- A database migration, or a Payload field whose stored type changes.
- A user-visible surface that has to be invented rather than copied.

**Breadth is not complexity.** Twenty files renaming one symbol carry the risk of one file, and
belong here.

## 2 — branch

**`<type>/<issue>-<slug>` off `dev`**, named per `docs/git-branching.md`.

```sh
git checkout -b <type>/$0-<slug> dev
```

**With no issue number, name it `<type>/<slug>` and say the branch is off-convention** — this repo
runs one branch per issue.

## 3 — code

**Read the standards the change touches** — `.claude/bin/standards.sh <profile...>` takes the whole
set in one call. One context writes everything: no slices, no subagents, no `.scratch/` ledger.

**Every file goes through `Write` or `Edit`.** The `PostToolUse` hook then formats it, spell-checks
it and runs its covering test, which is why this flow needs no separate test step. **A `sed` loop or
a heredoc gets none of that** — a wide rename still goes file by file.

**Write a test where the change adds behavior a test can reach.** A rename, a copy fix and a config
bump have none.

## 4 — gate

```sh
.claude/bin/gate.sh $0 full
```

**`fast` when nothing under `src/` moved** — it drops `yarn build`, which docs, dictionary entries
and agent files cannot break. On red the script prints the head of every failed log; read none of
them back.

## 5 — hand off

Propose a Conventional Commit title per `docs/git-workflow.md` and **stop** — the user runs the
commit.

**Report in three lines**: what changed, what the gate said, and what was noticed but left alone.
**Name any behavior this branch changed that no test covers** — nothing else in this flow will.
