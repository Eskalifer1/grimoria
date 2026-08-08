# Payload CMS embedded in Next.js as the backend, not a separate API app

Backend is Payload CMS 3, running embedded inside the Next.js app (App Router) — not a hand-rolled Node service (Fastify/NestJS/Express) and not a direct-to-database BaaS (Supabase). Frontend and backend live in one Next.js project and deploy together to a single Vercel project.

Why, given the project's actual constraints:

- The goal of this project is to showcase frontend work, not to learn backend engineering — the maintainer has limited backend/security/optimization experience and wants the backend to "just work" rather than be a second thing to design and defend.
- A hand-rolled Node backend (Fastify, NestJS) needs its own always-on host, which usually costs money — not acceptable for a pet project.
- A pure BaaS (Supabase accessed directly from the frontend) was rejected: the maintainer wants a real API layer between the UI and the database, not direct DB access from client code, and wants to practice GraphQL, which Supabase doesn't provide natively (PostgREST is REST + realtime only).
- Payload CMS generates both REST and GraphQL APIs automatically from collection definitions, satisfies the "real API layer" requirement, and — critically — deploys as part of the same Next.js/Vercel project, so there is no second host to pay for.
- Payload's access-control functions (collection- and field-level) map directly onto `Role` (ADR-0003) and `Visibility` (see `CONTEXT.md`), and its built-in Users collection covers auth, so both authorization and authentication come from the framework rather than hand-written code.

Database hosting: see ADR-0007 (Postgres on Neon).

**Payload's built-in admin is the only admin**, at `/cms` (`routes.admin`, which also places `importMap.js`, hence the folder name under `src/app/(payload)/`). No custom one is planned: it would serve the maintainer alone, while Payload already gives full CRUD over every collection, enforces the same access-control functions that guard the APIs, and takes custom pages via `admin.components.views`. A second UI over the same data would spend this project's frontend effort on the surface nobody sees.

The cost, accepted: it shows the data model rather than product concepts, is not themed, and extends only through Payload's component API. Revisit if a `moderator` who is not the maintainer ever has to moderate public Notes — that is a product surface, not a maintenance one.
