# Session 1 — turn a ticket into a spec

Reached from `SKILL.md` when the issue has neither `epic` nor `ready-for-agent`. **No code.**

1. `/mattpocock-skills:grilling` on the ticket. **Ask the grilling questions in Ukrainian** — it is
   local discussion. Everything written down stays American English: the spec, the issue bodies,
   the labels, the titles.
2. Read the upstream `to-spec` body and follow it, with the two departures below.
3. `gh issue edit <issue> --add-label ready-for-agent`, then stop.

A ticket that turns out to need more than one slice takes `epic` and goes to `breakdown.md`.

## The two departures from `to-spec`

**It publishes into this issue, not a new one.** The spec replaces the body; what the grilling
dropped is deleted.

**It ends with an `## Acceptance Criteria` section**, which the upstream template has no slot for.
`/implement-issue` reports a verdict per criterion at its handoff, and `/verify-branch` judges
against the same list — a spec without one arrives downstream with nothing to verify, and
`.claude/bin/ticket-context.sh` rejects it on the section heading alone.

**A criterion is one checkbox, stating an observable end state** — what is true once the ticket is
done, in terms someone can check without reading the diff. Prefer the evidence the ticket actually
produces: a command that succeeds, a page that renders, a value that reaches an environment. Six to
twelve of them for a normal ticket; a list past that is describing the implementation.

## Length

**The spec is read by an agent in a fresh context, and every turn of `/implement-issue` carries it.**
`.claude/rules/writing-docs.md` applies to the body as written, and its deletion pass runs over the
draft before it is published.

- **A user story earns its place by carrying a requirement no other section states.** The upstream
  template asks for an extensive list; here the list stops where restatement begins — five to ten is
  the normal shape.
- **One sentence per implementation decision, plus one for the alternative that lost** where a
  reviewer would plausibly propose it back. The grilling's reasoning stays in the grilling.
- **No section repeats another.** Where Acceptance Criteria and User Stories say the same thing, the
  criterion stays and the story goes.

## Reading an upstream skill body

`to-spec` and `to-tickets` carry `disable-model-invocation: true` — they can be read, never invoked:

```bash
cat ~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/<name>/SKILL.md
```

Empty output is a stop condition — `../implement-issue/failures.md`.
