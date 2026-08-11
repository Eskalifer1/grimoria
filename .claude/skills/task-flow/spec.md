# Session 1 — turn a ticket into a spec

Reached from `SKILL.md` when the issue has neither `epic` nor `ready-for-agent`. **No code.**

1. `/mattpocock-skills:grilling` on the ticket.
2. Read the upstream `to-spec` body and follow it, with one departure: **it publishes into this
   issue, not a new one.** The spec replaces the body; what the grilling dropped is deleted.
3. `gh issue edit <issue> --add-label ready-for-agent`, then stop.

A ticket that turns out to need more than one slice takes `epic` and goes to `breakdown.md`.

## Reading an upstream skill body

`to-spec` and `to-tickets` carry `disable-model-invocation: true` — they can be read, never invoked:

```bash
cat ~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/<name>/SKILL.md
```

Empty output is a stop condition — `../implement-issue/failures.md`.
