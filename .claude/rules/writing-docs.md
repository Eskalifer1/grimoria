---
paths:
  - "docs/**/*.md"
  - "design/**/*.md"
  - "CLAUDE.md"
  - "CONTEXT.md"
  - "README.md"
  - ".claude/rules/**/*.md"
  - ".claude/skills/**/*.md"
---

# Writing a doc here

These docs load on demand, so length is paid by every task that opens one. Write what the code and
the environment cannot say, once, and stop.

**The reader is a frontier model mid-task**, not a newcomer. It holds the stack, the language and
the framework already; it is missing only the local fact it has no way to derive.

## Contents

- What earns a line
- How to phrase it
- How it is shaped
- CLAUDE.md is a switchboard
- Say it once, in as few words as carry it
- What keeps it true
- The deletion pass

## What earns a line

- **The no-op test.** A line earns its place by changing behavior against the model's default.
  "Follow best practices", "keep components small", a paragraph on what a server component is —
  each pays load to say nothing. The test is model-relative and settled by running the doc, not by
  argument. A line that fails is deleted as a whole sentence: trimming its words keeps the no-op.
- **The environment is a source of truth.** `package.json` scripts, the Biome config, the folder
  tree, `--help` output. A doc restating them is a cache, and a cache earns its load only where
  the lookup is expensive. Cache the unwritten convention, the reason behind a choice, the gotcha
  no config confesses — and leave the one-command lookups where they cannot go stale.
- **The code is a source of truth too, and the larger one.** What a module exports, the fields of a
  type, the members of a namespace, an option's name and shape, a token's value, a contrast ratio, a
  schema's fields, a constant, a route — the reader opens the file and reads them faster than the
  doc can restate them. **Name the symbol and the path, and let the reader open it**:
  "`BoundControlProps` in `Form/types.ts`" over the props table. Write what stays true when the file
  is read: which of two shapes to reach for, the constraint the file cannot state, the failure the
  obvious reading produces.
- **A line closes a failure that was observed.** Written after watching a run go wrong, not in
  anticipation of one.

## How to phrase it

- **Prompt the positive.** State the target behavior. A prohibition drags the forbidden thing into
  context and makes it more available, so half of a ban reads as an instruction to do it. "Push
  `"use client"` down to the leaf that needs the browser" over "`views/` never carries
  `"use client"`". Keep a bare prohibition only where no positive phrasing exists, and pair it
  with the target anyway.
- **Match freedom to fragility.** Where several routes work, give the direction and the reason and
  let the reader choose. Where one route is safe, or a sequence breaks silently, give the exact
  command or the exact wording and say that it is exact. Vague guidance on a fragile step and rigid
  steps on an open one fail equally.
- **Reach for a leading word.** A word the model already holds — _cache_, _sediment_, _no-op_,
  _guardrail_, _ladder_ — anchors a whole region of behavior for one token, repeated as a token and
  never redefined. A triad spelled out at three sites, or a sentence gesturing at one idea, is
  asking to collapse into one word.
- **One term per thing, capitalized the way `CONTEXT.md` writes it** — Theme, User, Guest, Note.
- **Bold carries the claim, plain text the condition.** Reading only the bold yields the whole rule
  set; the prose behind it says when the rule applies and where its edge is.
- **An instruction states what to do and stops.** No justification, no account of how the decision
  was reached, no alternative that lost. Prose after the claim earns its place only by changing what the
  reader does at an edge the claim leaves open. Where a reader would otherwise reverse the rule on
  their own, the rule names the ADR that settled it.
- **An ADR is named by number; an issue never is.** What an issue settled is written into the doc
  or an ADR; what it left open stays out of the doc.

## How it is shaped

- **The first line says which question this doc answers, and names the doc holding the neighboring
  question.** It is read far more often than the body, and it is what sends a reader elsewhere
  before they pay for the rest.
- **A section holds up read alone.** Retrieval is partial and grep-driven, so "as described above"
  resolves to nothing. Repeat the noun.
- **One hop from `CLAUDE.md`.** A doc reachable only through another doc gets previewed rather than
  read, and comes back incomplete. Every doc earns its own trigger.
- **Past 100 lines, open with a Contents list**, so a partial read still shows the full scope. Past
  roughly 150 the doc is answering two questions — split it rather than compress it.

## CLAUDE.md is a switchboard

It loads into every session whether or not it is needed, so it holds **the trigger and the doc that
answers it, and stops** — a new subject earns one bullet in `## Where to look, by task`, never a
section of its own, and never a second sentence explaining what the doc will say. The substance
lives in the doc.

**Shorten the answer, never the trigger or the path.** The bullet is the only thing standing
between a task and the doc, so it names every situation that should send a reader there ("server
component, state, loading and error states") and gives a path that opens as typed. A trigger cut to
one word stops matching the task at hand, and a bare filename has to be searched for.

**Point at a doc a task will act on**, not at `docs/adr/` — the standards or feature doc a decision
produced is what gets read while working, and the ADR is reachable from there.

## Say it once, in as few words as carry it

Every doc here is read under a token budget, so **the shortest phrasing that keeps the meaning wins
over the fuller one**. Cut the throat-clearing, the restatement, the second example that shows the
same shape, the sentence that only sets up the next. Precision is what is being kept — dropping a
condition or a name to save words makes the doc wrong, which costs far more than length.

## What keeps it true

- **A doc grows by replacement.** Delete the sentence a change supersedes in the same edit.
  Appending is how sediment forms: stale layers that settle because adding feels safe, until
  someone has to core through them to reach what is still live.
- **Name what holds each rule** — Biome, `tsc`, or review alone.
- **Anything still moving stays out of the doc** — a state that will change without the doc
  noticing is written once it has settled. A superseded pattern worth keeping goes in a collapsed
  "Old patterns" note; dates inside prose go nowhere.
- **A rejected alternative lives in the ADR that settled it**, and the rule it produced names the
  ADR.
- **A copied list rots silently.** A table of exports, options or token values disagrees with the
  code on the first rename, and no gate catches it. Point at the symbol instead — a pointer stays
  right through the rename, and a wrong pointer fails a grep.
- **An open question lives in the issue that will close it.** A doc states what is settled; a `TBD`
  in a table, an "Open questions" section, a choice named but not made all read as fact to a model
  mid-task. Carry the question to the tracker and leave the row out until it is answered.

## The deletion pass

Run last, as its own pass, cutting only. Every sentence that fails the no-op test. An example that
restates the sentence above it — keep one concrete example per convention where the shape is the
point, and cut the abstract ones. A value already readable in the file the doc points at. A rule
another doc already states, replaced by a pointer to it. Every clause justifying an instruction
rather than qualifying it, and the story of how the current state came about.

**The pass leaves a trace.** Report per file: the line count before and after, what was cut, and
**the largest section considered and kept, with what makes it survive the no-op test**. A pass
reporting only cuts read as a pass that stopped at the easy ones; a pass reporting nothing did not
run.
