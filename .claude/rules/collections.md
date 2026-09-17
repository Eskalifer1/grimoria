---
paths:
  - "src/collections/**"
  - "src/payload.config.ts"
---

# Changing a collection here

**A field, collection, index or relationship added, removed or renamed gets its migration in the
same change** — `yarn payload migrate:create <name>`. `yarn dev` pushes the config into `dev`
without one, so nothing else reminds you. Rollback and the production deploy:
`docs/database-migrations.md`.

**Access control is written against `docs/features/auth.md`.**
