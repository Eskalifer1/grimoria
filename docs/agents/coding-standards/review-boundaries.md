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

**A correctness finding names the failing input and the wrong output it produces.** Races,
transactions and anything touching `payload.*` or `req` are
`.claude/skills/payload-security-review/SKILL.md`; every other correctness bug is
`.claude/skills/bug-hunt-review/SKILL.md`.

**A review never reads the ticket.** Whether the code meets what was asked is
`.claude/skills/self-verify/SKILL.md`, which reads nothing else; every axis here judges the code
against the standards and the platform, and a requirement is not a rule it may cite.

**Missing extensibility is never a finding.** Reportable: an abstraction standing without a second
consumer in the repo. Not reportable: the absence of one.

**Locale is an extension point placed by design.** `next-intl` carries several locales while
`messages/` holds one (`en`) — the copy contract, not Speculative Generality.
