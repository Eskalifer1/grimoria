---
name: checks
description: Run this repo's deterministic gates and report what went red — `yarn check`, `yarn typecheck`, `yarn spellcheck` and `yarn test` in fast mode, plus `yarn build` in full mode. Reports only; repairs nothing. Invoked as /checks or /checks fast, and by /implement-issue at its two gates.
argument-hint: "[full|fast] [tag]"
context: fork
agent: general-purpose
background: false
model: haiku
effort: low
allowed-tools: Bash, Read
---

# Run the `$0` gate now

Run the commands below, report what went red, change nothing. Whoever called this fixes what it
reports. Do not ask what to do — run the gate and answer.

**`$0` picks the gate. Anything that is not `fast` — including an empty argument — means `full`.**

**The log paths below carry the second argument verbatim.** Write them exactly as written; two
branches gate at once, and a fixed name has one of them reading the other's failure.

## 1. Skip a gate whose inputs did not move

**One command, exactly this:**

```sh
mkdir -p .scratch && git diff dev | shasum | cut -d' ' -f1 > .scratch/gate-$1.now && cat .scratch/gate-$1.green 2>/dev/null
```

`.scratch/gate-$1.green` holds two words from the last green run — the level, then the fingerprint.

**Answer `$0 gate: green, inputs unchanged since the last green <level> gate` and stop** when the
fingerprint matches **and** the recorded level covers the one asked for — `full` covers both, `fast`
covers only `fast`. Otherwise run section 2.

**The fingerprint is `git diff dev`, so any edit anywhere in the branch moves it.** A gate is
skipped only when the tree is byte-identical to the tree that already went green. **A file never
`git add -N`'d is invisible to it**, and this section will then skip a gate over code it cannot see.

## 2. Run the gate, in one command

**One command, and every gate in it even after one goes red** — one report carrying four failures
beats four round trips. **Running a command twice to learn its exit status is the defect this shape
exists to avoid.**

```sh
for c in check typecheck spellcheck test; do yarn $c > .scratch/checks-$1-$c.log 2>&1 && echo "$c: PASS" || echo "$c: FAIL"; done
```

**In `full` mode, and only when those four all printed PASS**, add the build:

```sh
yarn build > .scratch/checks-$1-build.log 2>&1 && echo "build: PASS" || echo "build: FAIL"
```

**Run the `package.json` scripts, never the binaries under them** — `yarn typecheck` runs
`next typegen` first, and Payload's generated types are stale without it.

**Biome and cspell run here even though a `PostToolUse` hook already ran them per file** — a file
appended by `Bash`, a rename, a deletion, and a word added to `.cspell/grimoria.txt` that changes
what a different file spells all reach this gate and nothing before it.

## 3. Report

**Green — record the fingerprint, then answer in one line, nothing after it:**

```sh
echo "<level> $(cat .scratch/gate-$1.now)" > .scratch/gate-$1.green
```

`full gate: green` or `fast gate: green`. No per-command entries, no summary of what passed.

**Red — leave `.scratch/gate-$1.green` alone**, so the next call re-runs. **Read the log of each
failed command back with the Read tool and copy from it** — the caller acts on the tool's own words,
so any rewording is a defect. Per failed command: the command, its log path, and **the log's first
60 lines, copied**. Head, not tail: Biome and `tsc` print the diagnostics first and a bare count
last.
