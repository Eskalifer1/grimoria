# TypeScript conventions

How a type is written: escape hatches, state modelling, domain shapes, naming, annotations.
_Which_ compiler flags are on and why is `docs/adr/0008-typescript-7-strict-config.md`;
_where_ a type lives is `general.md`. Settled rules, not options; where one is
machine-enforced the config is named, and that config is the source of truth.

`yarn check` reports the lint rules, `yarn typecheck` runs `tsc`, `yarn ci` fails on both.

## Escape hatches

Four constructs switch the checker off. Each has exactly one legal use, and the one legal use
of three of them is the same: an **ambient shim** for a third-party package that ships no
types, in a `.d.ts` file, carrying a `biome-ignore` with a reason.

```ts
// biome-ignore lint/suspicious/noExplicitAny: upstream ships no types, see <issue>
declare module 'untyped-pkg' { export function thing(input: any): any }
```

**`any` → `unknown` plus narrowing.** Machine-enforced — `suspicious/noExplicitAny`, `error`.

```ts
const value: unknown = JSON.parse(raw);
if (typeof value === 'string') { /* value is string here */ }
```

**`as` — three cases:** `as const`; narrowing `unknown` _after_ a runtime check has proven the
shape; the ambient shim. Everywhere else, prove the type instead of asserting it — a type
guard, an early return, or narrowing at the data boundary.

**`!` — never.** The non-null assertion cancels `noUncheckedIndexedAccess`, which ADR-0008
deliberately paid for. Check first:

```ts
const first = items[0];
if (!first) return null;   // ✓ first is T below this line
items[0]!.title            // ✗
```

**`@ts-expect-error`, with a reason, only in the ambient-shim case.** Machine-enforced —
`suspicious/noTsIgnore`, `error`, whose safe fix rewrites `@ts-ignore` into
`@ts-expect-error`. `@ts-ignore` and `@ts-nocheck` stay silent once the error underneath them
disappears; `@ts-expect-error` becomes an error itself the moment the line below compiles, so
it removes itself.

## `interface` vs `type`

Machine-enforced — `style/useConsistentTypeDefinitions`, `style: "interface"`. It only flags
object literals, so unions and compositions are untouched.

```ts
interface NoteCardProps { note: Note; author: ReactNode }   // ✓ object shapes
type NoteState = 'draft' | 'published';                     // ✓ unions
type NoteSummary = Pick<Note, 'id' | 'title'>;              // ✓ compositions
```

## State is a discriminated union

Independent optional fields let impossible states typecheck. A union on a literal discriminant
makes them unrepresentable and narrows every branch for free.

```ts
// ✗ nothing stops { ok: true, error: 'boom' }
interface Result { ok?: boolean; data?: Note; error?: string }

// ✓
type Result =
  | { status: 'success'; data: Note }
  | { status: 'error'; message: string };
```

That is shape, not contract: the actual Server Action result type is settled in #61 against a
real Payload error response. Until then, model local state this way.

### Exhaustiveness: `assertNever`

Every `switch` over a discriminated union ends in `default: assertNever(value)`
(`src/shared/lib/assertNever.ts`). While all variants are handled `value` is `never` and the
call typechecks; the day a variant is added, every unhandled `switch` fails `tsc` — and if the
database hands over a variant the types never knew about, it throws instead of silently
rendering nothing.

```ts
switch (state.status) {
  case 'draft':     return <DraftBadge />;
  case 'published': return <PublishedBadge at={state.publishedAt} />;
  default:          assertNever(state);
}
```

## Domain types come from Payload

`src/payload-types.ts` is the source of truth for every collection and document shape. Derive
from it; a hand-written parallel `interface Note` drifts from the schema the first time a
field changes.

```ts
type NoteSummary = Pick<Note, 'id' | 'title' | 'createdAt'>;   // ✓
interface Note { id: number; title: string }                   // ✗ duplicate of the schema
```

**Relationship fields carry a `depth` union.** Payload types a relationship as `number | User`
because the query's `depth` decides which arrives. Resolve it **once, at the data boundary** —
in `features/<name>/api/` or `entities/<name>/api/` — and pass the resolved shape down.
Components never see `number | User`, and never reach for `as` to get past it.

```ts
// entities/note/api/getNote.ts
type NoteWithAuthor = Omit<Note, 'author'> & { author: User };

async function getNote(id: number): Promise<NoteWithAuthor | null> {
  const note = await payload.findByID({ collection: 'notes', id, depth: 1 });
  return typeof note.author === 'object' ? { ...note, author: note.author } : null;
}

export { getNote };
```

## Literal unions, `as const`, `satisfies`

**No TypeScript `enum`** — it emits runtime code, sits awkwardly with `isolatedModules`, and
never matches what Payload generates. Derive the union instead: `type Role = User['role']`.

When the values also need to exist at runtime, use an `as const` object and `satisfies` to
check its shape without widening it:

```ts
const ROLE_LABELS = {
  admin: 'notes.role.admin',
  user: 'notes.role.user',
} as const satisfies Record<Role, string>;
```

`satisfies` verifies every `Role` has a label; `as const` keeps the values narrow. `as const`
alone skips the check; a plain `: Record<Role, string>` widens the values back to `string`.

## `null` vs `undefined`

**`null`** — the value is known absent, and that came from the data (Postgres, Payload).
**`undefined`** — nothing was provided: an optional prop, an omitted argument. Our own types
pick one; `field?: T | null` encodes three states where the domain has two.

## Naming

- **PascalCase, no `Type` suffix:** `Note`, not `NoteType`.
- **Singular for unions:** `type Role = 'admin' | 'user'`, not `Roles`.
- **`{ComponentName}Props`** for props, including when the type stays inside the file —
  consistent across export boundaries, and `git grep NoteCardProps` works.
- **Generic parameters are descriptive and `T`-prefixed:** `TKey`, `TValue`. A single
  parameter may stay `T`.

## Annotations vs. inference

Let the compiler infer what it can.

```ts
const title = 'Grimoria';                 // ✓
const title: string = 'Grimoria';         // ✗ says nothing tsc did not know
const [count, setCount] = useState(0);    // ✓
const [name, setName] = useState<string | undefined>(undefined);  // ✓ inference gives undefined only
```

**Exported functions carry an explicit return type.** It pins the module's contract, so a
change inside the function fails at the function rather than three files away. Non-exported
helpers and inline callbacks rely on inference. That same boundary carries the JSDoc rule —
`general.md`.

## Shape details

- **`object` → `Record<string, unknown>`.** `object` means "any non-primitive", arrays
  included. Review-enforced: `noBannedTypes` catches the `Object` reference, not the `object`
  keyword.
- **`{}`, `Object` and `Function` are banned.** Machine-enforced — `complexity/noBannedTypes`,
  `error`.
- **`import type` / `export type`** on every type-only import and export. Machine-enforced —
  `style/useImportType`, `style/useExportType`, `error`, both safe-fixable by
  `yarn check:fix`.
- **`T[]` for simple types, `Array<T>` for composed ones** — `readonly string[]`,
  `Array<string | number>`, `Array<() => void>`.
- **Complex parameter types get a name.** An inline object or callback in a signature becomes
  a named type: `function foo(id: string, onDone: NoteSavedCallback)`.

## `.d.ts` is for module augmentation

`skipLibCheck: true` means `tsc` does not check declaration files, so only ambient
declarations live there — augmenting a third-party package, or a global (`src/global.d.ts`).
Our own types live in `.ts` files, where they are actually checked.

## Keep types readable

This project is a portfolio piece read by people. A type a reviewer has to decode is not
paying for itself.

**Use freely:** `Partial`, `Required`, `Pick`, `Omit`, `Record`, `NonNullable`, `Awaited`,
`ReturnType`, and single-parameter generics.

**Justify in a comment, or write two concrete declarations instead:** conditional types,
`infer`, template-literal types, recursive types, mapped types with key remapping.

The test: if understanding the type needs more than one level of substitution held in your
head, write the declarations out.
