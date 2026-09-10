# Naming and file layout

What a folder or file is called, and where its test lives. Which layer it belongs to is `layers.md`;
how a component is built is `components.md`.

## Components

Every component is a **folder** named for its export in PascalCase, holding `index.tsx`. A
sub-component private to one parent is a nested folder inside it (`NoteCard/NoteCardHeader/index.tsx`): **nesting
expresses privacy**. Once a second parent uses it, promote it to a sibling, to `entities/`, or to
`shared/`.

Component types climb a ladder, only when the current rung hurts: **inline in `index.tsx`** →
**`NoteCard/types.ts`** when they bury the component → **`features/<name>/types.ts`** when more than
one place needs them. Domain shapes are not on this ladder (`typescript.md`).

`ui/` (`layers.md`) is the one exception to all of the above — it keeps the CLI's file shape.

## Naming

**Constants** SCREAMING_SNAKE, **keys inside a constant included** (`ROUTES.ADMIN`), in
`src/constants/`, one plain file per subject — themes, routes, durations, limits. A value earns a
name there once it means something beyond the line it sits on; a number that is only an
implementation detail of one function stays in that function. Named exports, not one nested object.
One object holds a set that is read as a set — `ROUTES` is the standing example, and `routing.md` says how a route joins
it.

**The split is by import graph, not by tidiness.** Every layer imports these files, so anything one
of them imports is inherited by everyone — a subject that ever needs a runtime import, or sits on
one side of the client/server boundary, must not share a file with subjects that do not.

**Every other file** camelCase, named for its
subject (`useNoteList.ts`, `createNote.ts`) and written as a plain file — only components get the
folder treatment. **A file named for a folder's subject is still named for its export**:
`action/runAction.ts`, not `action/run.ts`, so the import line says what it brings. `ui/`
keeps the CLI's own file names.

**A name says what the thing is or does**, and that holds for a local as much as an export.
`data`, `helper`, `utils`, `handleClick2` fail it — and so does **a bare verb**: `run`, `settle`,
`handle`, `process` name the shape of the work rather than the work. `runAction`,
`resolveWriteResult`, `settleFailure` name it. **Length is not the measure** — `key` and `fields`
say enough where the subject is obvious, and a name is not improved by making it longer than the
fact it carries.

## Tests

A **separate tree**, so a test may import from any layer — layer restrictions are scoped to `src/`.

```
tests/                                        Vitest
  i18n/theme.test.ts                          unit
  features/note/components/NoteCard.test.tsx  component
  setup/  fixtures/
e2e/                                          Playwright (#39)
```

- **`tests/` mirrors `src/`.**
- **Named after its subject**, not after `index`.
- **The suffix selects the layer**, so a misnamed test runs in the wrong project. The mapping is
  `docs/testing.md`.
- **Accepted cost:** renaming a component means moving its test, uncaught by tooling.
