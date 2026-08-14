---
name: docs-sync
description: Sync this repo's documentation (CONTEXT.md, docs/adr/, docs/features/*.md, docs/agents/*.md, CLAUDE.md) with a change that was just made or just discussed, so docs never drift from what the code/process actually does. Invoked manually after a conversation that decided something worth documenting, and by /implement-issue at step 7. Always proposes before writing — never edits docs unconfirmed.
---

## Two ways in

- **Called directly** — usually right after a conversation that settled something worth documenting (a new/changed term, a decision, a feature behavior), even before any code exists for it.
- **Called by `/implement-issue`** at step 7, over everything that session changed.

## Process

### 1. Gather inputs — conversation first, diff as the safety net

- **Conversation**: has this session explicitly discussed or decided something that belongs in a doc — a term, a behavior, a decision — regardless of whether code exists for it yet? This is the primary signal when called directly.
- **Diff**: everything not yet on the default branch — `git diff dev`, which covers the working tree because `/implement-issue` commits nothing — as a check for anything the conversation didn't call out explicitly. This is the primary signal when called from `/implement-issue`.

Use both when both are available.

If neither input has anything doc-relevant, say so and stop.

### 2. Resolve which feature (if any)

Don't maintain a path-to-feature manifest. Instead, in order:

1. The issue/ticket this session is working from — branch name, a `Closes #N` / `Part of #N` reference in a commit message, or an explicit mention in conversation — resolve it (`docs/agents/issue-tracker.md`) and match its slug/title to a `docs/features/<slug>.md`.
2. What the conversation was actually about (e.g. "we were discussing notes" → `docs/features/notes.md`).
3. A close filename match in `docs/features/` for whatever the diff touches.

If a feature has no doc yet and this is the session that actually built or decided it, that's a case for creating one — not speculatively ahead of time (CLAUDE.md "Feature docs").

### 3. Classify what changed

Bucket by what kind of fact changed:

- **Feature behavior** → `docs/features/<slug>.md` (resolved in step 2).
- **Domain language** (new/renamed entity, field, enum value, term) → `CONTEXT.md`'s glossary.
- **Hard-to-reverse architectural decision** → a new or updated file in `docs/adr/` (follow the existing numbering — never renumber or reuse a number). If this decision replaces an earlier ADR: before anything has shipped to production, don't keep the old one around with a `superseded` status — delete it and scrub references to it. Once something has actually shipped, don't delete — add a short paragraph to the new/updated ADR describing what the prior behavior was and why it changed, instead of keeping two files.
- **Process/tooling/convention** → `CLAUDE.md`.
- **Issue-tracker/label/agent-workflow convention** → the relevant `docs/agents/*.md`.

A single change can land in more than one bucket. Read this list from CLAUDE.md's `## Where to look, by task` section at the start of each run rather than treating the list above as fixed.

### 4. Check each candidate doc before proposing anything

Open every doc a bucket points to and compare it against the change. Only flag what's actually invalidated — don't pad a doc with detail the change didn't add.

### 5. Grep pass for indirect staleness

The primary doc for a change isn't always the only place it's mentioned. Grep `CONTEXT.md`, `CLAUDE.md`, and all of `docs/` for the term(s)/slug(s)/identifier(s) involved — including the **old** name when something was renamed, since the diff itself won't contain it anymore. A hit outside the primary doc that **repeats** the rule is a finding too, not just one that disagrees: leave a pointer in the secondary doc rather than edit the same rule twice. Four repeats are deliberate and are **not** findings:

- **The two `design/*-design.md` docs** are mirrors — each is one Theme's written look, read on its own. Only a pointer to another doc belongs in one place.
- **`docs/features/*.md`** carry what a rule means for that feature, beside a pointer at the rule itself.
- **CLAUDE.md's `## Where to look, by task` bullets** restate the rules they point at on purpose — they are the only copy always in context.
- **`docs/adr/`** records a decision as it stood. A standards doc saying it differently is a signal the decision was revisited, not drift.
A hit outside the primary doc that now disagrees is the drift this skill exists to catch.

### 6. Propose — don't write yet

Present a short plan to the user before touching any file: which docs you intend to update and why, and which candidate docs you checked and are leaving as-is (and why). Wait for confirmation or feedback.

Never apply edits before this checkpoint, even when the change seems obvious.

### 7. Apply the confirmed updates

### 8. Deletion pass — fresh eyes, cutting only

Hand **every** doc written or edited in step 7 to **one** subagent, in a single call. Its only inputs are the file paths and `.claude/rules/writing-docs.md` — no transcript, no reason for the change. Its brief: return the lines to cut and why, grouped by file, never a rewrite or an addition.

**One subagent for all of them, not one per file.** What the pass needs isolating from is the reason the edit was made, and that reason is the same for every file in the set; a context per file buys nothing and pays a fresh entry price each time.

Apply the cuts that hold.

### 9. Report

Close with a short report: which docs changed (one line each), what the deletion pass cut, which were checked and left alone, and anything still open.

## Known gaps (not solved by this skill)

- **State that changes outside git** — GitHub labels, milestones, and similar are never in a diff. This skill can't catch that class of drift by design; it relies on being invoked directly, from conversation, whenever such state changes.
- **Decisions made in conversation but never invoked** — if this skill isn't called, nothing checks anything. There is no background watcher; outside `/implement-issue` it runs only when asked.
