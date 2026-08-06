# Grimoria

A personal knowledge base for saving and rediscovering things you've learned
(articles, videos, approaches, libraries) as structured, searchable notes — with
an optional full dark-fantasy re-skin where the same product is framed as a
wizard's grimoire of spells.

## Getting started

Requires Node.js 20+. Yarn 4 is pinned via `packageManager` and a committed
release in `.yarn/releases`, so no global Yarn install is needed beyond a
launcher (`yarn` 1.x or Corepack).

```bash
yarn install
yarn dev
```

The app runs at http://localhost:3000.

## Scripts

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `yarn dev`          | Development server                                      |
| `yarn build`        | Production build                                        |
| `yarn start`        | Serve the production build                              |
| `yarn typecheck`    | Next route typegen, then `tsc --noEmit`                 |
| `yarn lint`         | Biome linter only                                       |
| `yarn lint:fix`     | Biome linter, applying safe fixes                       |
| `yarn format`       | Biome formatter, writing changes                        |
| `yarn format:check` | Biome formatter in check mode                           |
| `yarn check`        | Biome formatter + linter + import sorting, read-only    |
| `yarn check:fix`    | The same, applying every safe fix                       |
| `yarn ci`           | What CI runs — never writes to disk                     |
| `yarn spellcheck`   | cspell over the repo (code, docs, UI copy)              |

Biome is the single formatter and linter here; there is no Prettier or ESLint.
Import order is enforced as an assist action, so the editor's "Format Document"
alone won't fix it — run `yarn check:fix` (or let the committed workspace
settings organize imports on save).

## Documentation

- `CONTEXT.md` — domain glossary
- `docs/adr/` — architecture decisions and why the obvious alternative lost
- `docs/features/` — per-feature behavior
- `CLAUDE.md` — working conventions for agents

## License

[MIT](LICENSE)
