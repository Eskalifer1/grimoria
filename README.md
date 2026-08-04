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

| Script            | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `yarn dev`        | Development server                              |
| `yarn build`      | Production build                                |
| `yarn start`      | Serve the production build                      |
| `yarn spellcheck` | cspell over the repo (code, docs, UI copy)      |

## Documentation

- `CONTEXT.md` — domain glossary
- `docs/adr/` — architecture decisions and why the obvious alternative lost
- `docs/features/` — per-feature behavior
- `CLAUDE.md` — working conventions for agents

## License

[MIT](LICENSE)
