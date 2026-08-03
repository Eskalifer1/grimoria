# Postgres on Neon as Payload's database

Payload uses its Postgres adapter (`@payloadcms/db-postgres`, Drizzle under the hood), hosted on Neon — not MongoDB, and not Supabase's Postgres.

Postgres over MongoDB: the data is relational by nature (`User` → `Note`, `Role` enum, future tag/category relationships) — foreign keys and enums fit better than a document model.

Neon over Supabase Postgres: ADR-0005 already rejected Supabase as a BaaS (no GraphQL, direct-DB-access model conflicts with wanting a real API layer). Using Supabase purely for its Postgres hosting, with none of the rest of its stack, would look like a leftover of the earlier direction rather than a deliberate choice. Neon has its own generous free tier, an official Vercel integration, and serverless/branchable Postgres — same practical benefits, without the "why is Supabase here if we're not using Supabase" confusion for a future reader.
