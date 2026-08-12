---
name: self-verify
description: Check a branch against the requirements of the ticket it was written for — a fresh subagent finds the divergences each round, the main agent judges them and applies every fix. Two rounds minimum, three at most, fast gate after any round that fixed something. Invoked as /self-verify <issue-number> [range], and by /implement-issue at step 6.
argument-hint: "[issue-number] [range]"
---

# Self-verify issue #$0 over `$1`

**The ticket is #$0. The range is `$1`, or `dev` when `$1` is empty.**

**`dev`, not `dev...HEAD`.** The flow commits nothing until the user does, so a three-dot range
compares two commits and reports an empty diff over a branch full of work.

What a review may report at all is `docs/agents/coding-standards/review-boundaries.md`.

**This is the only axis that reads the ticket.** Step 8 judges the code against the standards and
never against the requirements; this step does the opposite.

## 1. The range must carry code

```sh
git diff --stat <range>
```

**An empty diff is a broken call, not zero divergences.** Say which range came back empty and stop.

**A file never added to the index is invisible to `git diff`.** `git add -N` on the branch's new
files is what step 4 owes this step; without it a whole new module reads as no change at all.

## 2. What a divergence is

**A requirement of the ticket that the code does not meet, meets differently, or meets more widely
than it was asked to.** All three, including the third.

Style, naming, layering, duplication, accessibility, access control and latent bugs are **not**
divergences here, however obvious they are on the way past. Step 8 pays for those.

## 3. The round

1. Gather the ticket with the `--json`/`--jq` form `/implement-issue` uses — **never
   `gh issue view --comments`, which prints nothing at all when the issue has no comments** — and
   the diff over the range.
2. Spawn a **fresh** subagent with what section 4 allows it, and nothing else.
3. It returns divergences in the shape below. It changes no code.
4. Judge each claim against the code, apply the fixes that hold, and write one line per claim —
   held or rejected, and on what grounds — to `.scratch/$0.md`.
5. Run the fast gate (`/checks fast $0`) when anything was fixed.

**The main agent applies every fix.**

### The shape a divergence comes back in

Prose, not a validated schema. Each divergence carries four things:

- the file and line,
- the requirement from the ticket, quoted or in the critic's own words,
- what stands in the code instead,
- whether the code misses it, does it differently, or does more than it.

Zero divergences is a complete answer for a round. It does not end the loop — section 5 decides
that.

## 4. What the critic sees

**The ticket with its comments, the diff, and read access to the repo.** A bare diff is hunks
without their surroundings, and a critic that cannot open a neighboring file reports a requirement
as unmet when the range simply never touched the place it was already met.

**It never receives the author's reasoning** — not `.scratch/$0.md`, not this conversation, not why
anything was decided. An agent is blind to exactly the assumptions it generated the code from, so a
critic handed those assumptions reproduces them and calls the result correct.

## 5. How many rounds

**Two minimum. A third only if the second still found something. Never a fourth.**

What is still open when the ceiling is reached goes into an issue comment as known debt, and the
flow continues.

**A later round's critic receives the claims of the rounds before it and does not repeat them.** It
gets the claims alone — **not the verdict and not the reason**.

**Known gap: a claim wrongly rejected in round 1 is never caught by round 2.** A rejection is final,
so judge each one as if no round follows it.

## 6. Screens against a design — does not exist yet

The natural round for a frontend change compares a screenshot against a visual reference, not a diff
against prose.

**It turns on when a canonical reference for a specific page exists.** A PNG under `design/` is not
that: the three files there are working files and explicitly not canonical for structure
(`docs/features/site-layout.md`), so a round comparing a page against them would report every piece
of chrome they show and the app does not have.

## 7. Report

Per round: the divergences the critic returned, and for each one whether it held or was rejected and
on what grounds. Then the fast gate's result when a fix was made.

At the end: how many rounds ran, why the loop stopped, and what went into the issue as debt.
