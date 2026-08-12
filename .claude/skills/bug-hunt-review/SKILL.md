---
name: bug-hunt-review
description: Hunt latent correctness bugs in a branch's changed code — edge inputs, floating promises, swallowed failures, state that disagrees with itself, assertions standing in for checks, the server/client boundary, cache and revalidation, and Payload hook ordering. Every finding names the input that breaks and the wrong output it produces. Reads code only; runs nothing and repairs nothing. Invoked as /bug-hunt-review [range], and by /review-axes as the bug-hunt axis.
argument-hint: "[range]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Read, Grep, Glob
---

# Bug hunt over `$0`

**The range is `$0`, or `dev...HEAD` when `$0` is empty.**

What a review may report at all is `docs/agents/coding-standards/review-boundaries.md` — read it
before reporting anything.

**Races, transactions and anything touching `payload.*` or `req` belong to
`/payload-security-review`.** That axis runs beside this one and reports them; a finding raised on
both sides is paid for twice at triage.

**This axis never reads the ticket.** Steps 6 and 11 of `/implement-issue` check the code against
its spec. Here the question is only whether the code does what it itself claims.

## 1. Gate — is there code of this axis in the range?

```sh
git diff --name-only <range> -- 'src/**' ':!src/app/(payload)/**' ':!src/payload-types.ts' ':!src/shared/components/ui/**'
```

`src/app/(payload)/` and `src/payload-types.ts` are generated, and `src/shared/components/ui/**` is
shadcn's vendored zone (`docs/agents/coding-standards/layers.md`). A bug in a test is caught by that
test going red, and `tests/` sits outside `src/` already.

**Empty list means zero findings.** Report the empty result and stop.

## 2. Read the full file, judge the changed lines

Read every changed file whole, plus each file that calls into it (`grep` the export name). A
function is correct or broken only against the arguments its callers actually pass, and the diff
hunk hides them.

Read `docs/features/<slug>.md` **when one matching the changed files exists** — routed by name, not
by walking `docs/features/`. That doc is the standing contract, so code disagreeing with it is a
finding.

**Report on lines this range changed**, and on a line the range left alone only where the change
made it reachable or made it wrong.

## 3. The bar every finding clears

Three conditions, all three, before a finding is written down.

**The scenario is reachable today** — a real path through a URL, a click, a request, or a database
state a User can produce. One exception: a **public contract** — an exported function, a Server
Action, a route handler — is reviewable against a caller that does not exist in the repo yet,
because a contract exists for callers written elsewhere.

**The finding names a concrete failing input and the concrete wrong output it produces.** That pair
is the `rule` field `review-boundaries.md` demands. A category name is not a rule, and a finding
that only reasons about what could go wrong is dropped.

**One finding per root cause.** Five symptoms of one bug are one finding, named at the cause.

**"No test covers this" is not a finding.** It is always true and costs nothing to prove. Where a
breaking input exists, the finding stands on that input alone.

## 4. The nine categories

Walk the eight per file, in order. The ninth collects what surfaced while walking them.

1. **Boundary inputs** — empty, one, many, zero, negative, very long. Off-by-one in pagination,
   `slice`, division, `%`.
2. **Async and ordering** — a floating `Promise`, a `Promise.all` where one rejection discards the
   rest, a late response overwriting a fresh one. Nothing in the toolchain holds this: see the
   `noFloatingPromises` row in section 5.
3. **Swallowed failure** — an empty `catch`, a `catch` returning a default that reads as success, an
   error thrown inside something nobody awaits.
4. **State that lies** — derived state stored instead of computed, two sources of truth for one
   fact, a first render that disagrees with the state after an effect.
5. **Assertion instead of a check** — `as`, `!`, a cast over `await res.json()`, a type narrower
   than the value it names. `any` and `@ts-ignore` are Biome errors; `as` and `!` are held by
   nothing.
6. **Server/client boundary** — a non-serializable prop crossing it, a `"use client"` module reading
   server-only `env`, a Server Action's return type over the wire.
7. **Cache and revalidation** — a missing `revalidatePath` after a write, an `unstable_cache` key
   missing one of its inputs, a value read at module scope and frozen for the process lifetime.
8. **Payload hooks and data shape** — hook ordering (`beforeValidate` → `beforeChange` →
   `afterChange`), a relationship read as an ID where `depth` populated an object, a field the type
   calls required that old rows hold as `null`. **Transactions belong to
   `/payload-security-review`.**
9. **Other** — a real bug fitting none of the eight. It gets **no walk of its own**: report what
   surfaced while walking the eight, and go looking no further. The bar in section 3 applies
   unchanged, and the finding states in one line why it fits none of the eight.

## 5. What `tsc` and Biome already hold — never report these

The gate is green before this review starts, so a finding naming one of these is wrong about the
toolchain, not about the code.

| Held by | What it holds |
| --- | --- |
| `tsconfig.json` | `strict`, and **`noUncheckedIndexedAccess`** — every index access is already `T \| undefined`, so "what if this element is missing" is red at the gate |
| Biome `recommended` | `noUnreachable` `noConstantCondition` `noSwitchDeclarations` `noFallthroughSwitchClause` `noPrecisionLoss` `noSelfAssign` `noSparseArray` `noDoubleEquals` `useValidTypeof` `noInvalidUseBeforeDeclaration` `noGlobalIsNan` `noUnusedVariables` |
| Biome `react` domain | `useExhaustiveDependencies` `useHookAtTopLevel` `noArrayIndexKey` |
| Biome `suspicious` | `noExplicitAny` `noTsIgnore` |

**`noFloatingPromises` is `nursery` and belongs to the `types` domain, which `biome.json` does not
enable** — a floating `Promise` is reportable here and nowhere else.

Style, naming, layering, duplication and Fowler's smells are the `standards` axis. Accessibility is
`/a11y-review`. Access control, injection and races are `/payload-security-review`.

## 6. Severity

| Severity | What lands here |
| --- | --- |
| `high` | A User sees wrong data, or an action silently did not happen. |
| `medium` | The code breaks on an edge input, an error is swallowed, or state diverges after an interaction. |
| `low` | Everything else. |

A thrown error screen is `medium` — a User sees it. An action that looks successful and did not
occur is `high` — a User never sees it.

## 7. Report

Each finding carries: the file and line, one sentence on what breaks, the failing input and the
wrong output it produces, and the concrete fix.

**Called by `/review-axes`** — return the axis JSON schema the workflow passed in, `axis:
"bug-hunt"`, the failing input and wrong output in the `rule` field.

**Called directly** — a markdown table, most severe first, then one line naming which of the eight
categories came back clean. **A shape landing in category 9 twice across runs is a ticket for a
ninth category** — say so in that line.

Zero findings is a complete answer. Report it in one line and add nothing.
