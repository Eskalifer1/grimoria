# Review boundaries

Which findings a code review may report. What the code should look like is the rest of
`docs/agents/coding-standards/`. Held by review alone.

**A finding names the rule it breaks** — the doc and the line, or the failing input and the wrong
output. A finding that argues from taste is dropped without a reply.

**Missing extensibility is never a finding.** Reportable: an abstraction standing without a second
consumer in the repo. Not reportable: the absence of one.

**Locale is an extension point placed by design.** `next-intl` carries several locales while
`messages/` holds one (`en`) — the copy contract, not Speculative Generality.
