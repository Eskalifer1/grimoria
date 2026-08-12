export const meta = {
  // Not `verify` — that collides with Claude Code's bundled /verify command.
  name: 'review-axes',
  description: 'Run the review axes over a task branch, one subagent each',
  phases: [{ title: 'Review', detail: 'review axes, one subagent each' }],
}

// Step 8 of /implement-issue, and only that step. A workflow cannot ask the user anything mid-run,
// which is why triage is step 9 and not part of this. The full gate is green before this runs.
// args: { issue: number, range: string } — the ticket number and the git range under review.
//
// This file is outside Biome's file set (`biome.json` → `files.includes`). The workflow VM demands
// a top-level `return` and `export const meta` as the first statement, and Biome rejects both.
// Plain JavaScript only, and `Date.now()` / `Math.random()` / `new Date()` throw — they would
// break resume caching.

const range = args?.range || 'dev...HEAD'

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['axis', 'findings'],
  properties: {
    axis: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'summary', 'rule'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          summary: { type: 'string' },
          rule: {
            type: 'string',
            description:
              'The doc and line this breaks, or the failing input and the wrong output. A finding without one is dropped at triage.',
          },
          detail: { type: 'string' },
        },
      },
    },
  },
}

// No spec axis here: step 6 (/self-verify) checks the code against the ticket, step 11 checks it
// again against the acceptance criteria, and a third pass in between pays for the same reading.
const AXES = [
  {
    key: 'standards',
    prompt: `Run the /mattpocock-skills:code-review skill over ${range}. Judge against this repo's own standards in docs/agents/coding-standards/ (reached through CLAUDE.md) plus Fowler's smell list. Before reporting anything, read docs/agents/coding-standards/review-boundaries.md — it decides which findings are reportable here at all, and it requires every finding to name the rule it breaks.`,
  },
  {
    key: 'a11y',
    prompt: `Run the /a11y-review skill over ${range}. Its gate comes first: a range that touches no .tsx under src/ outside src/app/(payload)/ returns zero findings and stops. Report against WCAG 2.2 AA, never against a rule Biome's a11y preset already holds, and read docs/agents/coding-standards/review-boundaries.md before reporting anything — it requires every finding to name the rule it breaks.`,
  },
  {
    key: 'payload-security',
    prompt: `Run the /payload-security-review skill over ${range}. Its gate comes first: a range that touches no server surface returns zero findings and stops. Never report something Better Auth, Payload, Vercel or Neon already holds — the skill lists them. Read docs/agents/coding-standards/review-boundaries.md before reporting anything, and name the concrete exploiting request behind every finding.`,
  },
  {
    key: 'bug-hunt',
    prompt: `Run the /bug-hunt-review skill over ${range}. Its gate comes first: a range touching no src/ file outside the generated and vendored zones returns zero findings and stops. Races, transactions and anything touching payload.* or req belong to the payload-security axis, not this one, and the ticket is never read here. Read docs/agents/coding-standards/review-boundaries.md before reporting anything, and name the concrete failing input and the wrong output it produces behind every finding.`,
  },
]

phase('Review')

const review = (
  await parallel(
    AXES.map((axis) => () =>
      agent(axis.prompt, { label: `review:${axis.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
    ),
  )
).filter(Boolean)

return { review }
