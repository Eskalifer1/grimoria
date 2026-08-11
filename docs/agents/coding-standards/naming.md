# Naming and file layout

What a folder or file is called, and where its test lives. Which layer it belongs to is `layers.md`;
how a component is built is `components.md`.

## Components

Every component is a **folder** named for its export in PascalCase, holding `index.tsx` — the folder
name is the searchable identifier, so keep it identical to the exported name. A sub-component
private to one parent is a nested folder inside it (`NoteCard/NoteCardHeader/index.tsx`): **nesting
expresses privacy**. Once a second parent uses it, promote it to a sibling, to `entities/`, or to
`shared/`.

Component types climb a ladder, only when the current rung hurts: **inline in `index.tsx`** →
**`NoteCard/types.ts`** when they bury the component → **`features/<name>/types.ts`** when more than
one place needs them. Domain shapes are not on this ladder (`typescript.md`).

The vendored zone (`layers.md`) is the one exception to all of the above.

## Naming

**Constants** SCREAMING_SNAKE, **keys inside a constant included** (`ROUTES.ADMIN`), in
`src/constants/`, one plain file per subject — themes, routes, durations, limits. A value earns a
name there once it means something beyond the line it sits on; a number that is only an
implementation detail of one function stays in that function. Named exports, not one nested object:
a bundler drops unimported names but keeps every branch of a touched object. One object holds a set
that is read as a set — `ROUTES` is the standing example, and `routing.md` says how a route joins
it.

**The split is by import graph, not by tidiness.** Every layer imports these files, so anything one
of them imports is inherited by everyone — a subject that ever needs a runtime import, or sits on
one side of the client/server boundary, must not share a file with subjects that do not. Splitting
buys nothing in bundle size: tree-shaking drops unused **exports**, never unused object keys.

**Component folders** PascalCase, matching the export. **Every other file** camelCase, named for its
subject (`useNoteList.ts`, `createNote.ts`) and written as a plain file — only components get the
folder treatment. A name says what the thing is or does; `data`, `helper`, `utils`, `handleClick2`
fail that. The vendored zone is exempt.

## Tests

A **separate tree**, so a test may import from any layer — layer restrictions are scoped to `src/`.

```
tests/                                        Vitest
  i18n/theme.test.ts                          unit
  features/note/components/NoteCard.test.tsx  component
  collections/users.integration.test.ts       integration
  setup/  fixtures/
e2e/                                          Playwright (#39)
```

- **`tests/` mirrors `src/`.**
- **Named after its subject**, not after `index`.
- **The suffix selects the layer**, so a misnamed test runs in the wrong project. The mapping is
  `docs/testing.md`.
- **Accepted cost:** renaming a component means moving its test, uncaught by tooling.

Colocation was rejected: with folder-plus-`index.tsx` it yields either `index.test.tsx`, naming
nothing, or a folder mixing private sub-components with tests, weakening nesting-means-privacy.
