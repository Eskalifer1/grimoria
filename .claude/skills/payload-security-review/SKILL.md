---
name: payload-security-review
description: Review a branch's changed server surfaces for security defects the framework does not hold — collection access control, IDOR, Local API access bypass, unauthenticated route handlers and Server Actions, unvalidated input, race conditions on writes, leaked secrets and stack traces, and the injection trio (XSS, SQL, SSRF). Reads code only; runs nothing and repairs nothing. Invoked as /payload-security-review [range], and by /verify-branch as the security axis.
argument-hint: "[range]"
context: fork
agent: general-purpose
background: false
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Read, Grep, Glob
---

# Payload security review over `$0`

**Run the review below now and report what it finds.** Change no code, and ask nothing.

**The range is `$0`, or `dev` when `$0` is empty.**

**`dev`, not `dev...HEAD`.** `/implement-issue` hands the branch over uncommitted, so a three-dot
range compares two commits and reports an empty diff over a branch full of work.

Who may do what is `docs/features/auth.md`. What a review may report at all is
`docs/agents/coding-standards/review-boundaries.md` — read it before reporting anything.

**Races, transactions and anything touching `payload.*` or `req` are this axis**, including a race
that only corrupts a User's own data. `/bug-hunt-review` runs beside this one and takes every other
correctness bug.

## 1. Gate — is there a server surface in this range?

```sh
git diff --name-only <range> -- 'src/collections/**' 'src/payload.config.ts' 'src/app/**/route.ts' 'src/**/*.ts' 'src/**/*.tsx' 'scripts/**' ':!src/app/(payload)/**' ':!src/**/*.css' ':!src/payload-types.ts'
```

`src/app/(payload)/` is Payload's own generated mount, and `src/payload-types.ts` is generated
output — neither is authored here.

**Empty list means zero findings.** Report the empty result and stop.

## 2. Read the full file, judge the changed lines

Read every changed file whole, plus the config that mounts it. An access function is correct or
broken only against the collection it guards and the plugin options above it; a Server Action is
safe or open only against what calls it.

**Report on lines this range changed**, and on a line the range left alone only where the change
made it reachable.

## 3. The ten checks

Walk all ten per file, in this order.

### 1. Every collection declares all five access operations

Payload fills a missing `access` key with `defaultAccess` — `Boolean(user) && user.collection ===
'users'`. Our admin collection **is** `users`, so an omitted key hands every signed-in User that
operation on every document. A new collection states `create`, `read`, `update`, `delete` and
`unlock` explicitly, even where the answer is `() => false`.

`admin.hidden` hides a collection from the panel and guards no request.

### 2. Ownership reads return a query constraint, not `true`

`read`, `update` and `delete` on User-owned data return a `Where` — `{ author: { equals:
user.id } }` — so the constraint reaches the database. A boolean `true` grants the whole collection
and the `id` in the URL decides the rest: that is IDOR, and it is this repo's most likely one.

Authorization comes from `req.user` and `id`. A value read out of `data` is the attacker's own
input.

`user.role` is a **string array** (`docs/features/auth.md`) — a permission helper decides, never
`user.role === 'admin'`. A field a User may write about themselves is listed in the plugin's
`allowedFields`; adding one to the collection alone leaves it writable through neither, adding one
to `allowedFields` alone is what opens self-promotion.

### 3. Local API calls on behalf of a User pass `overrideAccess: false`

`payload.find` / `create` / `update` / `delete` **bypass access control by default, even when
`user` is passed** — `user` alone is ignored. Acting for a User needs `overrideAccess: false` plus
that `user`. `overrideAccess: true` (the default) belongs to seeds, migrations and cron, and its
presence in a request path is a finding.

### 4. Route handlers and Server Actions authenticate themselves

`src/proxy.ts` is `next-intl`'s locale middleware and its matcher excludes `/api` — **nothing
guards a route by position.** Every handler under `src/app` outside `(payload)` and
`api/auth/[...all]` resolves the User itself:

```ts
const { user } = await payload.auth({ headers: await headers() });
```

A Server Action is a public POST endpoint. The check lives in the action body, not in the component
that renders its form.

### 5. Untrusted input is parsed before use

A body, a query parameter, a route segment and a Server Action argument are all attacker-supplied.
`zod` is a dependency: parse, then use the parsed value. A cast (`as`) over `await req.json()` is a
type-level assertion that checks nothing at runtime.

Data reaching a `beforeValidate` / `beforeChange` hook is untrusted too, including fields the UI
never shows.

### 6. Writes that must happen once are atomic

Ten identical requests can arrive inside the same millisecond, and none of them is the UI. A
`find` followed by a `create`/`update` is check-then-write: every one of the ten passes the check.

Uniqueness is a database constraint (`unique: true`), never a preceding existence query. A token,
invite or reset that may be used once is **consumed by a conditional update that matches its unused
state**, and the row it wrote is what proves the caller won. Work that must not interleave shares
one transaction through `req`. Rate limiting narrows a race and does not close it.

**A hook that writes runs inside the request's transaction only when it passes `req` on.** A
`beforeChange` or `afterChange` calling `payload.update` without it commits separately, so a later
failure rolls the document back and leaves that write standing.

### 7. Secrets stay on the server

`process.env` read in a module that a Client Component imports ships that value to the browser, and
`NEXT_PUBLIC_` ships it by definition. `src/payload.config.ts`, the Payload Local API and anything
importing them are server-only. A secret belongs in `.env.example` as a documented empty key.

### 8. Logs carry no credentials

A logged request body, User document, header bag, cookie or `process.env` puts a password, a
`better-auth.session_token` or `PAYLOAD_SECRET` into a log sink. Log identifiers, not payloads.

### 9. Errors reaching a User carry no internals

A handler's `catch` returns a generic message and a status; the stack, the SQL text, the driver
error and the file path stay server-side. Payload's own `Forbidden` and `ValidationError` messages
are user-facing by design and fine to pass through.

### 10. Injection — XSS, SQL, SSRF

- **XSS** — `dangerouslySetInnerHTML`, stored rich text rendered raw, and an `href` or `src` built
  from User data (`javascript:` is a URL).
- **SQL** — Payload's query API is parameterized. Only a raw `payload.db.drizzle` call with an
  interpolated value is reportable.
- **SSRF** — a server-side `fetch` whose URL comes from User input reaches the deployment's own
  network. An allowlist of hosts is the fix; a blocklist is not.

### Config drift — when the range touches `src/payload.config.ts`

The guarantees in check-list 4 below live in `betterAuthOptions`. A diff there is read against
`docs/features/auth.md`: session `expiresIn`/`updateAge`, `emailAndPassword`, `allowedFields`,
`roles`/`adminRoles`. A guarantee the diff removes is a `high` finding.

## 4. What the platform already holds — never report these

A finding naming one of these is wrong about the stack, not about the code:

| Held by | What it holds |
| --- | --- |
| Better Auth | Password hashing, session expiry and sliding, CSRF (Origin/Referer against `trustedOrigins`, plus Fetch Metadata on cookie-less sign-in), one-time expiring reset links, password length |
| Payload | Parameterized queries, field validation on declared field types, `Forbidden` on a failed access check |
| Vercel | HTTPS and HSTS |
| Neon | Backups and point-in-time restore |

**Row-level security is not our model.** Payload holds one Postgres role for every request, so the
database cannot tell Users apart — the access functions in check 1 and 2 *are* the row-level
boundary. A split of database keys into anon/service is likewise another product's shape.

**Bot protection, WAF rules and attack logging are deployment concerns** with no code in this repo
to review.

**Better Auth's rate limiter stores counters in memory**, which on serverless means per-instance
and therefore weak. That is a known configuration gap, not a per-branch finding — raise it once, in
the handover, not as a finding on a diff that did not cause it.

## 5. Severity

| Severity | What lands here |
| --- | --- |
| `high` | A Guest or another User reaches data or a write they should not, a privileged field becomes writable, or a secret reaches the client bundle. |
| `medium` | Authentication holds but the grant is wider than intended, input is unvalidated, a write races, or an error exposes internals. |
| `low` | Everything else. |

## 6. Report

**Every finding names the concrete request that exploits it** — method, path, body, and who is
signed in — or the doc and line it breaks. That request is the `rule` field
`review-boundaries.md` demands, and a finding that only reasons about what could go wrong is
dropped.

Each finding carries: the file and line, one sentence on what breaks, the request or rule behind
it, and the concrete fix.

**Called as a review axis by `/verify-branch`** — return the fields /verify-branch asks for, `axis:
"payload-security"`, the exploiting request or the doc line in the `rule` field.

**Called directly** — a markdown table, most severe first, then one line naming which of the ten
checks came back clean.

Zero findings is a complete answer. Report it in one line and add nothing.
