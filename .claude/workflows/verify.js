export const meta = {
  name: 'verify',
  description: 'Run the review axes over a task branch, one subagent each',
  phases: [{ title: 'Review', detail: 'review axes, one subagent each' }],
}

// Step 8 of /task-flow, and only that step: the stretch where nobody is asked anything.
// The full gate is green before this runs — step 7.
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

// Axes with no skill behind them yet are listed, not silently missing — uncomment the row when
// its ticket closes.
const AXES = [
  {
    key: 'standards',
    prompt: `Run the /mattpocock-skills:code-review skill over ${range}. Judge against this repo's own standards in docs/agents/coding-standards/ (reached through CLAUDE.md) plus Fowler's smell list. Before reporting anything, read docs/agents/coding-standards/review-boundaries.md — it decides which findings are reportable here at all, and it requires every finding to name the rule it breaks.`,
  },
  // { key: 'a11y', ... }                     not yet — #44
  // { key: 'payload-access-control', ... }   not yet — #45
  // { key: 'payload-performance', ... }      not yet — #46
  // { key: 'bug-hunt', ... }                 not yet — #47
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
