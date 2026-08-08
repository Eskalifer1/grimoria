---
name: docs-sync
description: Sync this repo's documentation (CONTEXT.md, docs/adr/, docs/features/*.md, docs/agents/*.md, CLAUDE.md) with a change that was just made or just discussed, so docs never drift from what the code/process actually does. Invoked manually after a conversation that decided something worth documenting, or automatically when the pre-commit hook flags staged changes with no doc update. Always proposes before writing — never edits docs unconfirmed.
---

Documentation drift is treated as a bug in this repo (see CLAUDE.md's "Keep docs current"). This skill is the concrete mechanism for that rule.

## Two ways in

- **Called directly** — usually right after a conversation that settled something worth documenting (a new/changed term, a decision, a feature behavior), even before any code exists for it.
- **Called by the pre-commit hook** — `.claude/hooks/docs-sync-check.sh` denies a `git commit` that stages non-doc changes with no doc touch, and its deny reason lists the exact staged files responsible. Treat that list as the diff input directly (no need to widen scope) and run this same process before the user retries the commit.

## Process

### 1. Gather inputs — conversation first, diff as the safety net

- **Conversation**: has this session explicitly discussed or decided something that belongs in a doc — a term, a behavior, a decision — regardless of whether code exists for it yet? This is the primary signal when called directly.
- **Diff**: everything not yet on the default branch — `git diff $(git merge-base origin/master HEAD)...HEAD` plus the working tree — as a check for anything the conversation didn't call out explicitly. This is the primary signal when called from the hook (which already narrows it to the staged files it flagged).

Use both when both are available — a session can decide something in words and also leave a partial diff; neither input alone is reliable.

If neither input has anything doc-relevant, say so and stop.

### 2. Resolve which feature (if any)

Don't maintain a path-to-feature manifest — a list mapping code paths to `docs/features/<slug>.md` would itself need the same upkeep this skill exists to avoid. Instead, in order:

1. The issue/ticket this session is working from — branch name, a `Closes #N` / `Part of #N` reference in a commit message, or an explicit mention in conversation — resolve it (`docs/agents/issue-tracker.md`) and match its slug/title to a `docs/features/<slug>.md`.
2. What the conversation was actually about (e.g. "we were discussing notes" → `docs/features/notes.md`).
3. A close filename match in `docs/features/` for whatever the diff touches.

If a feature has no doc yet and this is the session that actually built or decided it, that's a case for creating one — not speculatively ahead of time (CLAUDE.md "Feature docs").

### 3. Classify what changed

Bucket by what kind of fact changed:

- **Feature behavior** → `docs/features/<slug>.md` (resolved in step 2).
- **Domain language** (new/renamed entity, field, enum value, term) → `CONTEXT.md`'s glossary.
- **Hard-to-reverse architectural decision** → a new or updated file in `docs/adr/` (follow the existing numbering — never renumber or reuse a number). If this decision replaces an earlier ADR: before anything has shipped to production, don't keep the old one around with a `superseded` status — delete it and scrub references to it (a pre-launch decision that changed has no reader who needs the old version). Once something has actually shipped, don't delete — add a short paragraph to the new/updated ADR describing what the prior behavior was and why it changed, instead of keeping two files.
- **Process/tooling/convention** → `CLAUDE.md`.
- **Issue-tracker/label/agent-workflow convention** → the relevant `docs/agents/*.md`.

A single change can land in more than one bucket. Read this list from CLAUDE.md's `## Where to look, by task` section at the start of each run rather than treating the list above as fixed — if CLAUDE.md's doc layout changes, this skill should follow it, not drift from it.

### 4. Check each candidate doc before proposing anything

Open every doc a bucket points to and compare it against the change. Only flag what's actually invalidated — don't pad a doc with detail the change didn't add.

### 5. Grep pass for indirect staleness

The primary doc for a change isn't always the only place it's mentioned. Grep `CONTEXT.md`, `CLAUDE.md`, and all of `docs/` for the term(s)/slug(s)/identifier(s) involved — including the **old** name when something was renamed, since the diff itself won't contain it anymore. A hit outside the primary doc that **repeats** the rule is a finding too, not just one that disagrees: a rule living in two places has two places to drift, and the fix is to leave a pointer in the secondary doc rather than edit the same rule twice. Four repeats are deliberate and are **not** findings:

- **The two `design/*-design.md` docs** are mirrors — each is one Theme's written look, read on its own. They may describe the same material twice; only a pointer to another doc belongs in one place.
- **`docs/features/*.md`** carry what a rule means for that feature, beside a pointer at the rule itself.
- **CLAUDE.md's `## Where to look, by task` bullets** restate the rules they point at on purpose — they are the only copy always in context.
- **`docs/adr/`** records a decision as it stood. A standards doc saying it differently is a signal the decision was revisited, not drift.
 A hit outside the primary doc that now disagrees is exactly the drift this skill exists to catch — this is what would have caught the `docs/agents/labels.md` mismatch that prompted this skill's creation, had the label change gone through a code diff instead of `gh label` calls (which it didn't — see the "known gaps" note below).

### 6. Propose — don't write yet

Present a short plan to the user before touching any file: which docs you intend to update and why, and which candidate docs you checked and are leaving as-is (and why). Wait for confirmation or feedback.

- On confirmation, proceed to step 7 as proposed.
- On feedback, fold it in — this may change which docs get touched or how — then proceed.

Never apply edits before this checkpoint, even when the change seems obvious.

### 7. Apply and report

Apply the confirmed updates. Close with a short report: which docs changed (one line each), which were checked and left alone, and anything still open.

If this run was triggered by the hook's denial, tell the user the commit can be retried now — the same staged set will pass through this time.

## Known gaps (not solved by this skill)

- **State that changes outside git** — GitHub labels, milestones, and similar are never in a diff. This skill can't catch that class of drift by design; it relies on being invoked directly, from conversation, whenever such state changes.
- **Decisions made in conversation but never invoked** — if this skill isn't called, nothing checks anything. There's no background watcher; the hook only fires at commit time and only for staged code changes.
