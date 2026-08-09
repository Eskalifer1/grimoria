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
the framework already; it is missing only the local fact it has no way to derive. Explaining a
concept back to it costs load and returns nothing.

## What earns a line

- **The no-op test.** A line earns its place by changing behavior against the model's default.
  "Follow best practices", "keep components small", a paragraph on what a server component is —
  each pays load to say nothing. The test is model-relative and settled by running the doc, not by
  argument. A line that fails is deleted as a whole sentence: trimming its words keeps the no-op.
- **The environment is a source of truth.** `package.json` scripts, the Biome config, the folder
  tree, `--help` output. A doc restating them is a cache, and a cache earns its load only where
  the lookup is expensive. Cache the unwritten convention, the reason behind a choice, the gotcha
  no config confesses — and leave the one-command lookups where they cannot go stale.
- **A line closes a failure that was observed.** Written after watching a run go wrong, not in
  anticipation of one. Context files written speculatively measure out worse than no file at all:
  they add tokens, steps and cost while the agent was already right.

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
  asking to collapse into one word. A coined word recruits nothing and is paid for in definitions.
- **One term per thing, capitalized the way `CONTEXT.md` writes it** — Theme, User, Guest, Note. A
  synonym is a failed grep and two docs that look like they disagree.
- **Bold carries the claim, plain text the reason.** Reading only the bold yields the whole rule
  set; the prose behind it is depth for whoever needs it.

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

## What keeps it true

- **A doc grows by replacement.** Delete the sentence a change supersedes in the same edit.
  Appending is how sediment forms: stale layers that settle because adding feels safe, until
  someone has to core through them to reach what is still live.
- **Name what holds each rule** — Biome, `tsc`, or review alone. Unmarked, the reader re-verifies
  what the build already catches and trusts what nothing checks.
- **Anything still moving points at its issue** and says the issue is canonical, instead of
  describing a state that will change without the doc noticing. A superseded pattern worth keeping
  goes in a collapsed "Old patterns" note; dates inside prose go nowhere.
- **A rejected alternative keeps one line** wherever a reader would otherwise propose it back —
  `naming.md` on colocation is the shape. History is `git log` and `docs/adr/`; a live guardrail
  against a plausible mistake is not history.

## The deletion pass

Run last, as its own pass, cutting only. Every sentence that fails the no-op test. An example that
restates the sentence above it — keep one concrete example per convention where the shape is the
point, and cut the abstract ones. A value already readable in the file the doc points at. A rule
another doc already states, replaced by a pointer to it. The story of how the current state came
about.
