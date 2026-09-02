# Data access

Every read and every write goes through here. This file is a **router**: it decides which pattern a
surface gets, and sends you to the one file that says how to build it. Nothing else lives here, so
it stays readable in full every time.

Layer rules are `docs/agents/coding-standards/layers.md`; who may do what is
`docs/features/auth.md`. **#49 is canonical for every decision under this tree**.

## Two rules that cross every pattern

**One pattern per surface, and every write states which one it uses.** A surface that mixes two is
a surface whose failure behavior nobody can predict.

**Pattern A is allowed only when losing the write costs the User nothing** — a collapsed sidebar
section, a sort order. The value goes back to the server's and nobody is told. A control the User
will act on, a Theme toggle included, is pattern B with `onFailure: 'rollback'`; without that line,
A becomes the bin for "I did not want to design an error state".

## Which pattern

1. **Does it touch the server?** No → **None**. Otherwise carry on.
2. **Read or write?** Both at once counts as a write.
3. **A read: is stale data acceptable?** Yes → **None**. No → **D**.
4. **A write: is it a form?** Yes → question 5. No → question 6.
5. **Can the server's response be anticipated?** No → **C**. Yes → question 6.
6. **Must the User learn how it ended?** No → **A**. Yes → **B**.

**Question 5 is the one people get wrong.** Uniqueness checks, server-generated identifiers and
anything irreversible answer "no", however predictable they feel.

**Question 6 is about consequence, not confidence.** Collapsing a sidebar section → A. Renaming a
note → B.

## Which file

| What you are doing | Read |
| --- | --- |
| An optimistic write nobody needs told about | `docs/features/data-access/pattern-a.md` |
| An optimistic write whose failure the User must see | `docs/features/data-access/pattern-b.md` |
| A form that must wait for the server | `docs/features/data-access/pattern-c.md` |
| A surface with nothing partial worth showing | `docs/features/data-access/pattern-d.md` |
| Choosing or writing a hook, or a descriptor | `docs/features/data-access/optimistic-hooks.md` |
| Changing the store or its entry shape | `docs/features/data-access/store.md` |
| Changing what survives a reload, a second tab or a clock | `docs/features/data-access/persistence.md` |
| Writing a Server Action, a read, or `src/api/` | `docs/features/data-access/api-local.md` |
| Building a form — primitives, `useActionForm`, validation copy | `docs/features/forms.md` |

Each pattern file is **self-sufficient**: an agent that opens one writes working code without
opening a sibling. The duplication between them is the design.
