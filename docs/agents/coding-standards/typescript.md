# TypeScript conventions

How a type is written here. Compiler flags are `docs/adr/0008-typescript-7-strict-config.md`;
where a type lives is `naming.md`. Where a rule is machine-enforced the config is named and is the
source of truth.

## Escape hatches

Four constructs switch the checker off, and the one legal use of three of them is the same: an
**ambient shim** for a package shipping no types, in a `.d.ts`, with a `biome-ignore` carrying a
reason (`// biome-ignore lint/suspicious/noExplicitAny: upstream ships no types, see <issue>`).

- **`any` → `unknown` plus narrowing.** Machine-enforced (`suspicious/noExplicitAny`).
- **`as` — three cases:** `as const`; narrowing `unknown` _after_ a runtime check has proven the
  shape; the ambient shim. Elsewhere prove the type — a guard, an early return, or narrowing at the
  data boundary.
- **`!` — never.** It cancels `noUncheckedIndexedAccess`, which ADR-0008 deliberately paid for.
  Read the element, check it, then use it.
- **`@ts-expect-error`, with a reason, only in the shim case** (`suspicious/noTsIgnore`). It removes
  itself once the line below compiles, which `@ts-ignore` does not.

## Types

**`interface` for object shapes, `type` for unions and compositions.** Machine-enforced
(`style/useConsistentTypeDefinitions`), and it only flags object literals.

**State is a discriminated union** on a `status` field, so impossible states are unrepresentable and
every branch narrows for free. Every `switch` over one ends in `default: assertNever(value)`
(`src/shared/lib/assertNever.ts`): while all variants are handled it typechecks, and adding a
variant fails `tsc` in every switch that ignores it. The Server Action result type is settled in
#61 against a real Payload error response; until then this is the shape for local state.

**No `enum`** — it emits runtime code and never matches what Payload generates. Derive:
`type Role = User['role']`. When the values must exist at runtime,
`as const satisfies Record<Role, string>` checks the shape without widening it — `as const` alone
skips the check, and a plain annotation widens the values back to `string`.

**`null` is data-absent** (Postgres, Payload); **`undefined` is nothing-provided** (optional prop,
omitted argument). Our own types pick one — `field?: T | null` encodes three states where the
domain has two.

## Domain types come from Payload

`src/payload-types.ts` is the source of truth for every collection and document shape. Derive from
it — `type NoteSummary = Pick<Note, 'id' | 'title'>` — because a hand-written parallel
`interface Note` drifts from the schema the first time a field changes.

**Relationship fields carry a `depth` union.** Payload types a relationship as `number | User`
because the query's `depth` decides which arrives. Resolve it **once, at the data boundary** — in
`features/<name>/api/` or `entities/<name>/api/`, returning the resolved shape
(`type NoteWithAuthor = Omit<Note, 'author'> & { author: User }`) and passing it down. Components
never see `number | User`, and never reach for `as` to get past it.

## Naming and annotation

- **PascalCase, no `Type` suffix** (`Note`); **singular unions** (`Role`, not `Roles`).
- **`{ComponentName}Props`**, including when the type stays in the file — `git grep` works.
- **Generic parameters `T`-prefixed and descriptive**: `TKey`, `TValue`. A single one may be `T`.
- **Exported functions carry an explicit return type**, pinning the module's contract so a change
  inside the function fails at the function rather than three files away. Everything else relies on
  inference. That same boundary carries the JSDoc rule.

## Shape details

- **`object` → `Record<string, unknown>`.** Review-enforced: `noBannedTypes` catches the `Object`
  reference, not the `object` keyword.
- **`{}`, `Object`, `Function` are banned** — `complexity/noBannedTypes`.
- **`import type` / `export type`** on every type-only import and export — `style/useImportType`,
  `style/useExportType`, both safe-fixable.
- **`T[]` for simple types, `Array<T>` for composed ones** — `Array<() => void>`.
- **Complex parameter types get a name**: `function foo(id: string, onDone: NoteSavedCallback)`.
- **`.d.ts` is only for ambient declarations.** `skipLibCheck: true` means `tsc` does not check
  them, so our own types live in `.ts` where they are checked.

## Keep types readable

**Use freely:** `Partial`, `Pick`, `Omit`, `Record`,
`NonNullable`, `Awaited`, `ReturnType`, single-parameter generics. **Justify in a comment or write
two concrete declarations instead:** conditional types, `infer`, template-literal types, recursive
types, mapped types with key remapping.

The test: if understanding the type needs more than one level of substitution held in your head,
write the declarations out.
