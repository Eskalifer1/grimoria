# Authentication

How a User signs in, how a session is read, and what guards `role` — the mechanics behind #32.
Why Better Auth rather than Payload's own auth is ADR-0009; what `role` means is ADR-0003.

## Contents

- Shape
- Reading a session
- What a User may do
- Rate limiting
- Registration
- Seeding the first admin
- Theme
- Where it is checked
- Gotchas

## Shape

`payload-auth`'s `betterAuthPlugin` in `src/payload.config.ts` generates six collections —
`users`, `sessions`, `accounts`, `verifications`, `admin-invitations`, `rateLimit` — and installs a
Payload auth strategy that resolves Better Auth sessions. Nothing declares them; **editing the plugin options is
how the collections change**, and `src/collections/users.ts` adds the two fields Better Auth knows
nothing about (`theme`, `slug`) through `collectionOverrides`.

Two request surfaces, two rule sets:

- **`/api/auth/*`** (`src/app/api/auth/[...all]/route.ts`) is Better Auth's. Sign-up, sign-in,
  sign-out, session refresh, OAuth callbacks later (#1). Payload access control does not run here.
- **everything else** is Payload's, guarded by the access functions on each collection.

## Reading a session

```ts
const { user } = await payload.auth({ headers: await headers() });
```

`user` is the full Payload document — `user.role` is a **string array**, so a permission helper
decides, never `user.role === 'admin'`. A Guest is `user === null`; no stored role stands in for
one.

**This read does not extend the session** (the strategy passes `disableRefresh: true`, or a
Server-Action cookie write loops the admin panel's `buildFormState`). Sliding rides on the
client's own `/api/auth/*` traffic.

**A Guest reaching a members-only page gets `unauthorized()`, not a redirect** — a redirect to the
home page tells them nothing about why they left. `ProfilePage` is the pattern; the 401 surface it
raises is `docs/features/site-layout.md`.

A session is a row plus one `better-auth.session_token` cookie holding a **signed** token — the
value from a sign-in response body is the bare token and will not authenticate a request on its
own.

## What a User may do

|              |                                                            |
| ------------ | ---------------------------------------------------------- |
| Read         | self, or an admin                                          |
| Create       | admin only — everyone else registers through `/api/auth/*` |
| Update       | self, restricted to `allowedFields`; admins unrestricted   |
| Delete       | self, or an admin                                          |
| Reach `/cms` | `adminRoles` only                                          |

**`allowedFields` is what stops self-promotion** — a User PATCHing `{"role":["admin"]}` at their own
record gets "You are not allowed to perform this action". Adding a self-editable field means adding
it there, not only to the collection.

`read` being self-or-admin is the known gap: showing an author's name on a public Note needs it
widened, which lands with the first surface that displays one (#5 / Notes).

## Rate limiting

Better Auth limits `/api/auth/*` itself, in production only, and nothing outside it. The `rateLimit`
collection above is the table its counters live in.

## Registration

Sign-up returns a session immediately — **no email verification**, by decision. Password reset
still needs an email adapter, chosen in #1 alongside the UI; until then Payload logs mail to the
console.

That decision has a consequence worth knowing before #1: Better Auth refuses to link a social
account to a local row whose `emailVerified` is false (`requireLocalEmailVerified`), so
password-then-Google on one address errors rather than merging. The gate stays on — relaxing it is
the pre-registration takeover ADR-0009 describes.

## Seeding the first admin

`yarn seed` reads `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` and `SEED_ADMIN_NAME` and **makes that
admin exist with that password** — a re-run rewrites the credential of an account that is already
there, which is the intended way to change it. Creation goes through Better Auth's sign-up so the
hash matches a real registration; the role is written afterwards through the Local API, the only
path allowed to write `role`.

## Theme

`user.theme` is the stored truth and the `theme` cookie is what renders, for Users and Guests alike.
`resolveTheme()` (`src/i18n/resolveTheme.ts`) reads the `[theme]` root param and nothing else;
`src/proxy.ts` is the only place the cookie is read, which is what lets a page be prerendered
(ADR-0015).

**The two are reconciled whenever Better Auth hands out a session.** `sessionCookiesPlugin`
(`src/auth/`) matches on `ctx.context.newSession` rather than on a list of paths — sign-up, every
sign-in method, session refresh — and writes the profile's Theme into the cookie alongside the
`optimistic-scope` cookie carrying the User id. Signing out clears the scope and leaves the Theme,
which is a device preference and also words the sign-out screen. A Theme changed on another device,
or in Payload's admin, reaches this one at its next session write.

Both cookies are readable by JavaScript by design: the scope during `OptimisticScope`'s first
render, the Theme by the toggle in #78, which owes a write to `user.theme` and the cookie together.

## Where it is checked

`/payload-security-review [range]` on demand, and automatically as the `payload` axis in section 5
of `/verify-branch`. That axis is earned by a diff touching a collection, `payload.config.ts`,
`proxy.ts`, a route handler, `"use server"`, or a new read of User input — a range touching none of
them skips it.

## Gotchas

- **`scripts/patchPayloadAuth.mjs` repairs the installed package** on `postinstall` and again
  ahead of every `payload` CLI call — it publishes bundler-only ESM, and its adapter prints a false
  ambiguity warning on every session read. The script's own comment carries both.
- **`yarn generate:importmap` after touching the plugin options** — the admin's login, signup and
  reset screens are the plugin's components and reach the browser through that map.
- **`BETTER_AUTH_SECRET` is a hard error in production**, not a warning, and rotating it signs
  every live session out.
- **`withInviteExpiry` keeps a database with no admin able to make one** — without it `/cms` answers
  400 on a fresh database. Only ever reached before the first admin exists, which is why local work
  never sees it.
- `yarn install` prints unmet-peer warnings from `@better-auth/*`; they declare runtime
  dependencies as peers, everything resolves, and adding them to `package.json` would be a lie.
- **`/cms/signup` answers only to an invite token** from the `admin-invitations` collection, which
  an admin generates from a User's edit screen. Registration for everyone else is `/api/auth/*`.
