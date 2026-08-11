# Better Auth for authentication, mounted through the `payload-auth` plugin

Authentication is **Better Auth**, embedded in Payload by `payload-auth`'s `betterAuthPlugin`. The auth strategy on `users` is Better Auth's, sessions are rows in a generated `sessions` collection, and every credential flow goes through `/api/auth/*`. **Authorization stays Payload's** — collection- and field-level access-control functions keyed on `role` (ADR-0003).

OAuth is the reason. Google and GitHub sign-in are required (#1), Payload ships no OAuth of its own, and the constraint on this project is that auth is configured rather than written (ADR-0005).

## Rejected

- **payload-oauth2** — OAuth only, one plugin instance per provider, and user creation, account linking and GitHub's separate `/user/emails` call stay hand-written. That is the custom auth backend this decision exists to avoid.
- **payload-authjs** — Auth.js is folding into Better Auth, so adopting it buys a migration.
- **Payload's own auth plus a hand-rolled OAuth callback** — the same objection, more of it.

## What it settles past #32

Impersonation (#11), role and permission checks (#10), listing and revoking sessions from the profile (#5), rate limiting (#19) and banning a User are Better Auth features rather than mechanics to design. Each still needs its UI.

## Sessions

**A session is a database row plus one cookie carrying its token.** Nothing self-describing travels with the request, so revoking a session takes effect immediately. `expiresIn` of 14 days with `updateAge` of 1 day slides the window — any Better Auth request inside it extends the row — which is what a refresh token buys elsewhere. There is no refresh token here and no refresh code to write; `disableSessionRefresh` is what would turn the sliding off.

**`payload.auth()` reads a session without extending it.** The plugin's strategy passes `disableRefresh: true`, because a Server-Action cookie write invalidates the router cache and loops the admin panel's `buildFormState`. Sliding therefore rides on the client's own `/api/auth/*` traffic; the plugin also mounts a refresh endpoint on the users collection for the case where there is none.

Optional on top: **the cookie cache**, a signed copy of session and user in the cookie, so a read costs no query. It carries Better Auth's own user model, so a field added to the Payload collection appears there only if it is also declared in `betterAuthOptions.user.additionalFields` — and the cookie has to stay under ~4 KB. Payload's `saveToJWT` is a different mechanism and does not reach it.

## Costs accepted

- **Two authorization systems.** `/api/auth/*` obeys Better Auth's rules; every other route obeys Payload access control. A rule that has to hold on both gets written twice.
- **`role` is a `hasMany` select**, not the single value a fresh reader expects — ADR-0003 carries what that changes.
- The plugin **replaces the admin login and signup views** and generates `users`, `sessions`, `accounts`, `verifications` and `admin-invitations`. Config changes need `yarn generate:importmap`.
- **`payload-auth` has one maintainer and a major version released days before adoption**, so it is pinned to an exact version and each upgrade is read before it is taken.
- **Its published ESM only loads under a bundler**, so `scripts/patchPayloadAuth.mjs` rewrites the installed files on `postinstall` and `package.json` carries `"type": "module"`. Without both, every Payload CLI command dies on the config import — the script's own comment carries the detail.
- `yarn install` prints unmet-peer warnings: the `@better-auth/*` packages declare their runtime dependencies as peers. Everything resolves hoisted, and adding those packages to `package.json` would misrepresent them as ours.

**Account linking stays at Better Auth's defaults.** This app verifies no email at sign-up, and each relaxation available there — an entry in `accountLinking.trustedProviders`, `requireLocalEmailVerified: false`, `allowDifferentEmails` — converts that into pre-registration account takeover: register the victim's address, wait for them to sign in with the real provider, inherit their identity.
