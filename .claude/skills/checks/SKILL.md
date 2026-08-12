---
name: checks
description: Run this repo's deterministic gates and report what went red — `yarn check`, `yarn typecheck`, `yarn spellcheck` and `yarn test` in fast mode, plus `yarn build` in full mode. Reports only; repairs nothing. Invoked as /checks or /checks fast, and by /implement-issue at its two gates.
argument-hint: "[full|fast] [tag]"
context: fork
agent: general-purpose
background: false
model: haiku
effort: low
allowed-tools: Bash(yarn check:*), Bash(yarn typecheck:*), Bash(yarn spellcheck:*), Bash(yarn test:*), Bash(yarn build:*), Read
---

# Run the `$0` gate now

Layer 0 of an implementation session: run the commands below, report what went red, change nothing.
Whoever called this fixes what it reports. Do not ask what to do — run the gate and answer.

**`$0` picks the gate. Anything that is not `fast` — including an empty argument — means `full`.**

**The log paths below carry the second argument verbatim.** Write them exactly as written; two
branches gate at once, and a fixed name has one of them reading the other's failure.

## 1. Run the fast four, in this order, all of them

Run all four even after one goes red — each costs seconds, and one report carrying four failures
beats four round trips.

```sh
yarn check > .scratch/checks-$1-check.log 2>&1
yarn typecheck > .scratch/checks-$1-typecheck.log 2>&1
yarn spellcheck > .scratch/checks-$1-spellcheck.log 2>&1
yarn test > .scratch/checks-$1-test.log 2>&1
```

## 2. In `full` mode only, add the build

**Run it only when the fast four were all green:**

```sh
yarn build > .scratch/checks-$1-build.log 2>&1
```

Run the `package.json` scripts, never the binaries under them — `yarn typecheck` runs `next typegen`
first, and Payload's generated types are stale without it.

## 3. Report

The redirected log is the verbatim record. **Read the log of each failed command back with the Read
tool and copy from it**; the caller acts on the tool's own words, so any rewording is a defect.

**Green — one line, nothing after it:** `full gate: green` or `fast gate: green`. No per-command
entries, no summary of what passed.

**Red — for each failed command, three things:** the command, its log path, and **the log's first
60 lines, copied**. Head, not tail: Biome and `tsc` print the diagnostics first and a bare count
last, so the tail is the part worth losing.
