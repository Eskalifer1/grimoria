---
name: docs-audit
description: Sweep the docs set for rot — dead references, contradictions, duplication, bloat, stale auto-memory — rank the proven findings, then apply exactly the ones you name. Reports in Ukrainian; edits nothing first.
argument-hint: "[path]"
disable-model-invocation: true
---

# Audit the docs for rot

`/docs-sync` keeps one doc current with a change that just happened. **This skill reads the whole
set and asks what has gone stale since.** It reports, waits for the maintainer, and applies only
what they name.

**Only the maintainer starts this run.** No skill, hook or step dispatches to it, and it dispatches
to no other skill.

**Every user-facing line this skill prints is Ukrainian** — the report, the selection question, the
per-finding proof, the closing line. Paths, commands, code, bucket names and severity words stay as
written here; the prose around them is Ukrainian.

Every write happens after section 5.

## Contents

1. Scope 2. Buckets 3. The bar a finding clears 4. Report 5. Selection 6. Apply, then prove
7. Closing line

## 1. Scope

**Read the scope list at run time from the `paths:` frontmatter of `.claude/rules/writing-docs.md`**
rather than restating it here. Add the project's auto-memory directory:

```sh
sed -n '/^---$/,/^---$/p' .claude/rules/writing-docs.md
MEM=~/.claude/projects/$(pwd | tr '/' '-')/memory && ls "$MEM"
```

**`$0` narrows the sweep to that file or subtree**, matched against the resolved file list. Empty
means everything.

## 2. Buckets

Five, and a finding belongs to exactly one.

- **`dead-reference`** — a path, script, environment variable, token, command or label a doc names
  that no longer exists as named.
- **`contradiction`** — two docs stating the same fact differently, or a doc stating a fact the
  artifact contradicts.
- **`duplication`** — one fact stated in full in two places, where one copy should become a pointer.
- **`bloat`** — a section or bullet breaking a named rule in `.claude/rules/writing-docs.md`.
- **`stale-memory`** — an auto-memory entry whose subject is gone, that a doc now says, that a doc
  contradicts, or that `MEMORY.md`'s index and the files on disk disagree about.

### Where the truth lives, per reference kind

| Reference | Checked against |
| --- | --- |
| path, file, directory | the filesystem |
| `yarn <script>` | `package.json` |
| environment variable | `.env.example` |
| CSS token | `src/styles/*.css` |
| `/skill` or `.claude/bin/*.sh` | `.claude/skills/`, `.claude/bin/` |
| GitHub label | `gh label list` |

**`gh label list` is the only check that leaves the machine.** When `gh` is unavailable, print one
line saying the label check was skipped and audit everything else.

### How deep contradictions go

**A claim naming a grep-able artifact** — a path, an export, a script, a config key, a token, a
route — **is checked everywhere in scope.** Grep for the artifact, not for the sentence.

**A behavioral claim is checked only in the docs that exist to state a contract**:
`docs/features/data-access/*.md` and `docs/features/auth.md`.

### The bloat bar

A bloat finding **cuts a whole section or a whole bullet, names the `writing-docs.md` rule it
breaks, and there are at most five per document.**

**Three mechanical checks run unconditionally and are not capped**: a doc past 150 lines, a doc past
100 lines with no Contents list, and a doc not reachable in one hop from `CLAUDE.md`.

### The deliberate repeats

**Four repeats in this repo are on purpose and are never findings.** Read them from step 5 of
`.claude/skills/docs-sync/SKILL.md` at run time rather than from a copy here.

## 3. The bar a finding clears

**Every `dead-reference` and every `contradiction` finding is proven by a command that actually ran
during this audit and came back empty** — `ls`, `grep`, `gh label list`, a `package.json` read.
Keep the command; section 6 re-runs it.

**A `duplication` finding names both locations and which copy stays.**

**A finding that cannot be proven is dropped**, never written down hedged.

## 4. Report

**One flat list sorted worst-first**, bucket as a tag on each finding.

Severity is what an agent does wrong after reading the line:

- **`high`** — `dead-reference`, `contradiction`. The agent goes down a false path.
- **`medium`** — `duplication`. The agent fixes one copy of two.
- **`low`** — `bloat`. The agent pays tokens for nothing.
- **`stale-memory` takes the rank of whichever of those it causes.**

Each finding is a numbered three-line block, written in Ukrainian:

```
#3 [dead-reference] high  docs/agents/labels.md:41
Опис лейбла `frontend` каже, що адмінка живе на `/admin`; вона на `/cms`.
Правка: `gh label edit frontend --description "…/cms…"` — рядок у доці береться з лейбла.
```

**A table cannot hold the edit line.** Use the block.

## 5. Selection

Ask once, in Ukrainian, then wait:

> Які знахідки виправити? Номери (`3 7 9`), назви бакетів (`dead-reference`), `all`, або нічого.

**Apply only what was named.** Naming a bucket applies every finding in it. Naming nothing changes
no file — `git status` stays clean and the run ends at section 7.

## 6. Apply, then prove

**Edit through `Write`/`Edit`** so `.claude/hooks/gate-written-file.sh` runs over each file.

**`/docs-sync` is not the writer here.**

**Re-run the command that produced each applied finding and report the result per finding**, in
Ukrainian, one line each. Then
`yarn spellcheck` over the set. The write hook covers formatting and spelling per file but cannot
know whether the edit fixed what was found.

## 7. Closing line

**Name what was left unapplied, in Ukrainian, each with the writer that owns it**: `/docs-sync` for
a doc, a manual edit for an auto-memory entry, `gh label edit` for a label description.
