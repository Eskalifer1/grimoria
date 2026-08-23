# Grimoria

A personal knowledge base for saving and rediscovering things you've learned
(articles, videos, approaches, libraries) as structured, searchable notes — with
an optional full dark-fantasy re-skin where the same product is framed as a
wizard's grimoire of spells.

## Getting started

```bash
yarn install
cp .env.example .env   # then fill both values in
yarn dev
```

`PAYLOAD_SECRET` is any long random string (`openssl rand -hex 32`); `DATABASE_URL` points at
Postgres (Neon, ADR-0007). Without it the app runs, but anything touching the database fails.

### Database

One Neon project with two branches, matching the git ones: local development and everything
outside production use `dev`, production uses `main`.

Development pushes the config's shape into `dev` on boot. Production is migrated instead: every
schema change is committed to `src/migrations`, and Vercel's build runs them against `main` first.
`docs/database-migrations.md` is the workflow.

The app runs at http://localhost:3000, with Payload's admin at `/cms` — the only admin there
is, for the maintainer's own use (ADR-0005).

## Documentation

- `CONTEXT.md` — domain glossary
- `docs/adr/` — architecture decisions and why the obvious alternative lost
- `docs/features/` — per-feature behavior
- `CLAUDE.md` — working conventions for agents

## License

[MIT](LICENSE)
