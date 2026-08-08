# TypeScript conventions

> **Scope.** How types are written day to day: escape hatches, how state is modelled, how
> domain shapes are derived, how types are named and annotated.
>
> *Which* compiler flags are on and why — `strict`, `noUncheckedIndexedAccess`,
> `noImplicitOverride` — is `docs/adr/0008-typescript-7-strict-config.md`. *Where* a type
> lives (which layer, which file) is `general.md` §4.4 and §7. This document is how the type
> itself is written.
>
> These are settled rules, not options. Where a rule is machine-enforced, the enforcing
> config is named — that config is the source of truth, not this document.

---

## 1. Escape hatches

Four constructs switch the type checker off. Each has exactly one legal use.

### 1.1 `any` → `unknown` plus narrowing

**Machine-enforced** — `biome.json` → `suspicious/noExplicitAny`, `error`.

```ts
const value: unknown = JSON.parse(raw);
if (typeof value === 'string') { /* value is string here */ }
```

The single exception is an **ambient shim for a third-party package that ships no types**,
in a `.d.ts` file (§10), carrying a `biome-ignore` with a reason:

```ts
// biome-ignore lint/suspicious/noExplicitAny: upstream ships no types, see <issue>
declare module 'untyped-pkg' { export function thing(input: any): any }
```

### 1.2 `as` — three cases

`as const`; narrowing `unknown` **after** a runtime check has already proven the shape; an
ambient shim (§1.1). Everywhere else, prove the type instead of asserting it — a type guard,
an early return, or narrowing at the data boundary (§5).

### 1.3 `!` — never

The non-null assertion cancels `noUncheckedIndexedAccess`, which ADR-0008 deliberately paid
for. Check first:

```ts
const first = items[0];
if (!first) return null;   // ✓ first is T below this line
items[0]!.title            // ✗
```

### 1.4 `@ts-expect-error` — with a reason, where `any` is already legal

**Machine-enforced** — `biome.json` → `suspicious/noTsIgnore`, `error` (safe fix rewrites
`@ts-ignore` into `@ts-expect-error`).

`@ts-ignore` and `@ts-nocheck` stay silent once the error underneath them disappears.
`@ts-expect-error` becomes an error itself the moment the line below it compiles, so it
removes itself. Use it only in the ambient-shim case of §1.1, with the reason on the same
line.

---

## 2. `interface` vs `type`

**Machine-enforced** — `biome.json` → `style/useConsistentTypeDefinitions`, `style: "interface"`.

- **`interface`** for object shapes — component props, entity-like shapes, options bags.
- **`type`** for unions, mapped types, and one-off compositions. The rule only flags object
  literals, so these are untouched.

```ts
interface NoteCardProps { note: Note; author: ReactNode }   // ✓
type NoteState = 'draft' | 'published';                     // ✓
type NoteSummary = Pick<Note, 'id' | 'title'>;              // ✓
```

---

## 3. Modelling state: discriminated unions

A set of independent optional fields lets impossible states typecheck. A union on a literal
discriminant makes them unrepresentable, and narrows every branch for free.

```ts
// ✗ nothing stops { ok: true, error: 'boom' }
interface Result { ok?: boolean; data?: Note; error?: string }

// ✓
type Result =
  | { status: 'success'; data: Note }
  | { status: 'error'; message: string };
```

The illustration above is shape, not contract: the **actual** Server Action result type is
settled in #61, against a real Payload error response. Until then, model local state this way
and let #61 name the fields.

---

## 4. Exhaustiveness: `assertNever`

Every `switch` over a discriminated union ends in `default: assertNever(value)`
(`src/shared/lib/assertNever.ts`). While all variants are handled, `value` is `never` and the
call typechecks. The day a variant is added, every unhandled `switch` fails `tsc` — and if
the database hands over a variant the types never knew about, it throws instead of silently
rendering nothing.

```ts
switch (state.status) {
  case 'draft':     return <DraftBadge />;
  case 'published': return <PublishedBadge at={state.publishedAt} />;
  default:          assertNever(state);
}
```

---

## 5. Domain types come from Payload

`src/payload-types.ts` is the source of truth for every collection and document shape — see
`general.md` §1.3 and §4.4. Derive from it; a hand-written parallel `interface Note` drifts
from the schema the first time a field changes.

```ts
type NoteSummary = Pick<Note, 'id' | 'title' | 'createdAt'>;   // ✓
interface Note { id: number; title: string }                   // ✗ duplicate of the schema
```

**Relationship fields carry a `depth` union.** Payload types a relationship as
`number | User`, because the query's `depth` decides which one arrives. Resolve that union
**once, at the data boundary** — in `features/<name>/api/` or `entities/<name>/api/` — and
pass the resolved shape down. Components never see `number | User`, and never reach for `as`
(§1.2) to get past it.

```ts
// entities/note/api/getNote.ts
type NoteWithAuthor = Omit<Note, 'author'> & { author: User };

export async function getNote(id: number): Promise<NoteWithAuthor | null> {
  const note = await payload.findByID({ collection: 'notes', id, depth: 1 });
  return typeof note.author === 'object' ? { ...note, author: note.author } : null;
}
```

---

## 6. Literal unions, `as const`, `satisfies`

**No TypeScript `enum`.** It emits runtime code, sits awkwardly with `isolatedModules`, and
never matches what Payload generates anyway. Derive the union from the generated type:

```ts
type Role = User['role'];   // 'admin' | 'user'
```

When the values also need to exist at runtime — to iterate, or to reference by key — use an
`as const` object, and `satisfies` to check its shape without widening it:

```ts
const ROLE_LABELS = {
  admin: 'notes.role.admin',
  user: 'notes.role.user',
} as const satisfies Record<Role, string>;
```

`satisfies` verifies every `Role` has a label; `as const` keeps the values narrow. `as const`
alone skips the check; a plain annotation (`: Record<Role, string>`) widens the values back
to `string`.

---

## 7. `null` vs `undefined`

- **`null`** — the value is known to be absent, and that came from the data (Postgres, Payload).
- **`undefined`** — nothing was provided: an optional prop, an omitted argument.

Our own types pick one. `field?: T | null` encodes three states where the domain has two.

---

## 8. Naming types

- **PascalCase**, no `Type` suffix: `Note`, not `NoteType`.
- **Singular for unions**: `type Role = 'admin' | 'user'`, not `Roles`.
- **`{ComponentName}Props`** for props — `NoteCardProps`, including when the type stays
  inside the file. Consistent across export boundaries, and `git grep NoteCardProps` works.
- **Generic parameters are descriptive and `T`-prefixed**: `TKey`, `TValue`. A single
  parameter may stay `T`.

File and folder naming is `general.md` §8.

---

## 9. Annotations vs. inference

Let the compiler infer what it can:

```ts
const title = 'Grimoria';                 // ✓
const title: string = 'Grimoria';         // ✗ says nothing tsc did not know
const [count, setCount] = useState(0);    // ✓
const [name, setName] = useState<string | undefined>(undefined);  // ✓ inference gives undefined only
```

**Exported functions carry an explicit return type.** It pins the module's contract, so a
change inside the function fails at the function rather than three files away.

```ts
export function formatNoteDate(value: string): string { ... }
```

Non-exported helpers and inline callbacks rely on inference.

---

## 10. `.d.ts` is for module augmentation

`skipLibCheck: true` means `tsc` does not check declaration files. Only ambient declarations
live there — augmenting a third-party package, or a global (`src/global.d.ts`, `general.md`
§1.4). Our own types live in `.ts` files, placed by the ladder in `general.md` §4.4, where
they are actually checked.

---

## 11. Shape details

- **`object` → `Record<string, unknown>`.** `object` means "any non-primitive", arrays
  included. Review-enforced: `noBannedTypes` catches the `Object` reference, not the
  `object` keyword.
- **`{}`, `Object` and `Function` are banned.** **Machine-enforced** —
  `complexity/noBannedTypes`, `error`.
- **`import type` / `export type`** on every type-only import and export. **Machine-enforced**
  — `style/useImportType` and `style/useExportType`, `error`, both with safe fixes, so
  `yarn check:fix` handles it.
- **`T[]` for simple types, `Array<T>` for composed ones** — `readonly string[]`,
  `Array<string | number>`, `Array<() => void>`.
- **Complex parameter types get a name.** An inline object or callback in a signature becomes
  a named type: `function foo(id: string, onDone: NoteSavedCallback)`.

---

## 12. Keep types readable

This project is a portfolio piece read by people. A type a reviewer has to decode is not
paying for itself.

**Use freely:** `Partial`, `Required`, `Pick`, `Omit`, `Record`, `NonNullable`, `Awaited`,
`ReturnType`, and generics with a single parameter.

**Justify in a comment, or write two concrete declarations instead:** conditional types,
`infer`, template-literal types, recursive types, mapped types with key remapping.

The test: if understanding the type requires holding more than one level of substitution in
your head, write the declarations out.

---

## 13. Where each rule is enforced

| Rule | Enforced by |
| --- | --- |
| No `any` (§1.1) | `suspicious/noExplicitAny`, `error` |
| No `@ts-ignore` (§1.4) | `suspicious/noTsIgnore`, `error` |
| `interface` for object shapes (§2) | `style/useConsistentTypeDefinitions`, `style: "interface"` |
| No `{}` / `Object` / `Function` (§11) | `complexity/noBannedTypes`, `error` |
| `import type` / `export type` (§11) | `style/useImportType`, `style/useExportType`, `error` |
| Unchecked index access (§1.3) | `tsconfig.json` → `noUncheckedIndexedAccess` (ADR-0008) |
| Exhaustive `switch` (§4) | `assertNever` + `tsc` |
| Everything else | review |

`yarn check` reports the lint rules; `yarn typecheck` runs `tsc`; `yarn ci` fails on both.
