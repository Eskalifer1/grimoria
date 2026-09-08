# Grimoria

A personal knowledge base for saving and rediscovering things you've learned
(articles, videos, approaches, libraries) as structured, searchable notes — with
an optional full dark-fantasy re-skin where the same product is framed as a
wizard's grimoire of spells.

## Getting started

```bash
yarn install
cp .env.example .env   # then fill the blank values in
yarn dev
```

The app validates its environment at startup (`src/constants/env.ts`) and refuses to boot with a
missing or malformed variable, naming every one of them in a single error.

- `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET` — each any long random string (`openssl rand -hex 32`),
  and not the same value. Required.
- `DATABASE_URL` — the pooled Postgres string (Neon, ADR-0007). Required.
- `DATABASE_URL_UNPOOLED` — the same branch's direct string, used for schema work. Optional; falls
  back to `DATABASE_URL`.
- `BETTER_AUTH_URL` — the origin auth builds its URLs from. Optional: unset, Better Auth uses the
  request's own origin. Write it out in production so a post-sign-in redirect cannot land on a
  preview URL.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` — read by `yarn seed` alone, never at
  boot.

Every variable carries its own comment in `.env.example`.

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
