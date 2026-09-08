# Database migrations

How a schema change reaches production. Two databases, both Neon branches of one project: `dev`,
which development pushes to, and `main`, which migrations run against. They are never swapped.

## The trigger: changing a collection

**Adding, removing or renaming a field, a collection, an index or a relationship means generating a
migration in the same change.** `yarn dev` pushes the config straight into `dev`, so the app works
before the migration exists — and nothing else will remind you.

```sh
yarn payload migrate:create <name>
```

It reads the config, not a database, and writes three things to `src/migrations`: the SQL as
`up`/`down`, a `.json` snapshot the next migration diffs against, and a line in `index.ts`. All
three are committed. **None of them is hand-edited** — regenerate instead, deleting the files the
bad run wrote.

`src/migrations` is excluded from Biome and cspell.

## Ids are UUIDs

Every table's primary key is a `uuid` the browser may supply (`idType: 'uuid'`,
`allowIDOnCreate: true` — ADR-0010). Postgres cannot cast a `serial` column to `uuid` in place, so a
database still holding the integer schema fails the dev push with `column "id" cannot be cast
automatically to type uuid`. Drop and recreate that database's schema: there is one migration, and
`dev` holds nothing worth keeping.

## Verifying the `down` half

Prove the `down` half against a throwaway branch cut off `main`:

1. In the Neon console, branch `main` to `rollback-check`.
2. Copy that branch's **direct** connection string — the one without `-pooler`. Neon's pooled
   endpoint cannot perform schema work.
3. `yarn migrate:verify-rollback '<direct-connection-string>'` — applies, rolls back one batch,
   applies again.
4. Delete the branch.

## What the deploy does

Vercel's build command is `yarn build:migrate`, which is `payload migrate && next build`. Pending
migrations run against `main` first, and a failure fails the build, so no deploy is produced and the
running deploy keeps serving the schema it was built for.

**`yarn build` alone touches no database.**

Payload's CLI sets `PAYLOAD_MIGRATING`, which `src/constants/env.ts` reads to send schema work down
the direct connection string and request traffic down the pooled one.

### What Vercel production holds

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon `main`, pooled |
| `DATABASE_URL_UNPOOLED` | Neon `main`, direct |
| `PAYLOAD_SECRET` | A secret of its own, not the one in `.env` |
| `BETTER_AUTH_SECRET` | Likewise. Nothing passes Better Auth a `secret`, so there is no fallback |
| `BETTER_AUTH_URL` | The production origin, written out — unset, a post-sign-in redirect can land on a preview URL |

The function region is set in Vercel's settings to match the Neon project's region, never in a
committed config file (#82). `package.json` pins `engines.node` to the newest major Vercel offers.

## Creating the project

Once, by hand: `./scripts/setup-vercel-project.sh` walks the dashboard steps — create the project,
override the build command, set the five variables, match the region, and check whether `main`
already holds tables from an earlier push, since a first migration against a non-empty schema fails.
