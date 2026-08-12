# Review boundaries

Which findings a code review may report. What the code should look like is the rest of
`docs/agents/coding-standards/`. Held by review alone.

**A finding names the rule it breaks** — the doc and the line, or the failing input and the wrong
output. A finding that argues from taste is dropped without a reply.

**An accessibility finding names a WCAG 2.2 AA success criterion** — number and name. The level and
who enforces which part is `accessibility.md`.

**A security finding names the request that exploits it** — method, path, body, and who is signed
in. What the platform already holds, and is therefore never a finding, is
`.claude/skills/payload-security-review/SKILL.md`.

**Missing extensibility is never a finding.** Reportable: an abstraction standing without a second
consumer in the repo. Not reportable: the absence of one.

**Locale is an extension point placed by design.** `next-intl` carries several locales while
`messages/` holds one (`en`) — the copy contract, not Speculative Generality.
