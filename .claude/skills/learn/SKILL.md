---
name: learn
description: Turn a correction the user just gave about how code is written into a standing rule in docs/agents/coding-standards/. Judges whether the point generalizes beyond the case that provoked it, finds the doc that owns it, proposes the exact lines, and writes only after a nod. Invoked as /learn, and run without being asked whenever the user rejects an approach rather than a fact.
---

# Learn from a correction

The input is whatever the user just said — an argument to `/learn`, or the correction itself when
this runs unprompted. **Run it in the same turn as the fix**, not at the end of the session: an
unrecorded correction is one the next session repeats.

## 1. State the rule in one sentence, stripped of its case

Write what was actually asked for, with the file, the library and the ticket removed. "Don't
duplicate the user check in every action" becomes "a step every member of a family performs belongs
to a wrapper". If the sentence cannot survive losing its case, it is not a standard — go to step 5.

## 2. Decide whether it generalizes

**It is a standard when it would apply to the next feature written by anyone**, on a different
surface, with a different library. Three questions, all of which must hold:

- Would a reviewer cite it against unrelated code?
- Does it hold if the framework or the library changes?
- Is it about how code is written, not what this feature does?

**It is not a standard** when it is one library's API detail, one file's quirk, or a decision about
this feature's behavior. Those go to step 5.

## 3. Find the doc that owns it

Read CLAUDE.md's `## Where to look, by task` and pick the doc whose trigger already covers the
subject — `abstraction.md` for reuse and shape, `typescript.md` for types, `components.md` for React,
`accessibility.md` for ARIA and keyboard, `layers.md` for where code lives, `documentation.md` for
comments and JSDoc.

**A new doc only when no trigger fits** — and then it also earns a bullet in CLAUDE.md, or nothing
will ever open it.

**Check the doc first.** The rule may already be there in different words, in which case sharpen the
existing line rather than adding a second one that half-disagrees.

## 4. Propose, then write

Show the target file and the exact lines. **Write nothing before the user's nod.** Phrase it against
`.claude/rules/writing-docs.md`: bold carries the claim, plain text the condition, no story of what
provoked it, and delete the sentence the new rule supersedes.

Where the correction is about how to work rather than how to write code — a workflow, a preference,
what to check before proposing — the destination is the memory directory as a `feedback` entry,
under the same rules.

## 5. When it does not generalize

Say so, and put it where it belongs instead: a comment carrying the _why_ at the code, a line in the
feature doc, or nothing at all. **Report the judgment either way** — "recorded in X" or "left local
because Y" — so the decision is visible rather than silent.

## 6. Report

One line: the rule, the file it landed in, and anything you chose not to record.
