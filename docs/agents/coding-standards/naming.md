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

**Component folders** PascalCase, matching the export. **Every other file** camelCase, named for its
subject (`useNoteList.ts`, `createNote.ts`) and written as a plain file — only components get the
folder treatment. A name says what the thing is or does; `data`, `helper`, `utils`, `handleClick2`
fail that. The vendored zone is exempt.

## Tests

A **separate tree**, so components stay uncluttered and a test may import from any layer — layer
restrictions are scoped to `src/`.

```
tests/                                        Vitest + React Testing Library
  features/note/components/NoteCard.test.tsx
  setup/  fixtures/
e2e/                                          Playwright
```

- **`tests/` mirrors `src/`**, so nothing has to be searched for and a test whose subject was
  deleted stands out.
- **Named after its subject**, not after `index` — this keeps `git grep NoteCard` finding both.
- **`e2e/` is separate**: different runner, config, and CI job (advisory).
- **Accepted cost:** renaming a component means moving its test, uncaught by tooling.

Colocation was rejected: with folder-plus-`index.tsx` it yields either `index.test.tsx`, naming
nothing, or a folder mixing private sub-components with tests, weakening nesting-means-privacy.
Which layer of test to write is `docs/testing.md`.
