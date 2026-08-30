# Postgres on Neon as Payload's database

Payload uses its Postgres adapter (`@payloadcms/db-postgres`, Drizzle under the hood), hosted on Neon — not MongoDB, and not Supabase's Postgres.

Postgres over MongoDB: the data is relational by nature (`User` → `Note`, `Role` enum, future tag/category relationships) — foreign keys and enums fit better than a document model.

Postgres 18 over 17: Neon cannot upgrade a project's major version in place — moving means a new project and a data migration — so the newest supported version is the cheap choice at creation time. The one reason to have picked 17 expired: PG18 broke Drizzle's schema push (`DROP CONSTRAINT ... _id_not_null`), fixed in drizzle-kit 0.31.7 and shipped in Payload 3.65.

Neon over Supabase Postgres: ADR-0005 already rejected Supabase as a BaaS (the direct-DB-access model conflicts with wanting a real API layer). Using Supabase purely for its Postgres hosting, with none of the rest of its stack, would look like a leftover of the earlier direction rather than a deliberate choice. Neon has its own generous free tier, an official Vercel integration, and serverless/branchable Postgres — same practical benefits, without the "why is Supabase here if we're not using Supabase" confusion for a future reader.
