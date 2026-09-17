# The `src/api/` layer

Where server code lives, what a Server Action returns, and how a read differs from a write. Which
pattern a *surface* gets is `docs/features/data-access.md`; layer rules are
`docs/agents/coding-standards/layers.md`; who may do what is `docs/features/auth.md`. **#49 is
canonical**, and #61 owns this file.

## Where it lives

**Everything touching the server lives under `src/api/<domain>/`** — reads and Server Actions both,
grouped by domain. **`src/api/core/` holds what every domain shares** and is the one folder under
`api/` any domain may import: the Payload client, the session, the permission helpers, and the
action wrapper.

**Payload is reached through `getPayloadClient()`**, and **a session through `getSessionUser()`** —
both `cache()`d per request, so a layout, its page and the action they trigger pay for one
initialization and one session read.

## Writing an action

**An action file declares what differs and nothing else.** `createProtectedAction` (a session is
required) or `createAction` (a Guest may call it) owns the session, the parse, the authorization
call, the error mapping, the logging and the revalidation; the file supplies `name`, `schema`,
`handler`, and optionally `authorize` and `tags`.

```ts
'use server';

const updateName = createProtectedAction({
  name: 'user.updateName',
  schema: updateNameSchema,
  tags: ({ user }) => [recordTag('users', user.id), collectionTag('users')],
  handler: async ({ input, user, payload }) => { /* the write, with overrideAccess: false */ },
});
```

- **One exported action per `"use server"` file, and nothing else — not a schema, not a type.** Every
  export of such a file is a public endpoint reachable with arbitrary arguments, and the loader that
  rewrites the file leaves a broken reference behind for an export that is not an async function.
  An action is a folder — `index.ts` holds the action, `contract.ts` the schema, `optimistic.ts`
  the client-side transition — and the schema promotes to a shared module on its second consumer.
- **A handler refuses by throwing an `ActionError`** carrying a code (`notFoundError()`,
  `forbiddenError()`); the wrapper turns it into the failure member. Anything else that throws is a
  defect: logged server-side, returned as `UNEXPECTED`.
- **A duplicate is a `CONFLICT`, not a defect.** Ids are UUIDs the browser mints (ADR-0010), so a
  caller can repeat one. A create checks for the id itself and throws `ActionError(CONFLICT)`;
  underneath, the wrapper reads Postgres's `23505` off anything thrown and answers `CONFLICT` rather
  than `UNEXPECTED` (`src/api/core/uniqueViolation.ts`). That covers the race between the check and
  the insert, and every other unique index.
- **`authorize` decides the right, the collection still decides access.** Writes pass
  `overrideAccess: false` and the session `user`, so Payload's own rules run underneath. Roles are
  asked through `src/api/core/permissions.ts` — `role` is a list, so `user.role === 'admin'` is
  always wrong.
- **`tags` names what a write invalidates**, resolved after the handler succeeds — a fixed array,
  or a function reading the context for a record only the session names. **A mutation of one record
  names the record tag and its collection tag** (a list carries the field too) —
  `collectionTag`/`recordTag` from `src/constants/cacheTags.ts` build both. The wrapper calls
  `updateTag` per tag; one failure is logged and the call still answers
  success — the row is written, and a failure there would show the User an outcome the database
  disagrees with.
- **A handler may navigate.** `redirect` and `notFound` throw a sentinel Next has to see, so the
  wrapper rethrows it before it can be mistaken for a defect.

## What a call answers with

**Every call resolves to `ActionResult<TData>`** (`src/shared/lib/actionResult.ts`) — a union on
`status`, built by `actionSuccess`/`actionFailure`, never a throw across the client boundary. Both
members declare `data` and `error`, one of them `null`.

**A failure is a code, never a message**: `ACTION_ERROR` in `src/constants/action.ts` holds the codes
any call can answer with, each with copy under `actionError` in both catalogs, so a Theme words the
failure. `useActionErrorMessage()` turns a failure into a sentence, and an unknown code reads as the
generic one rather than reaching a User raw. A validation failure also carries `fields` — the
schema's own messages per field path, in English and outside `messages/`, so they are a server-side
diagnostic and not something a surface renders. A form places its own copy beside the input, keyed
by the field, and words the schema's own refusals from catalog keys the schema carries —
`docs/features/forms.md`.

## Calling one from the client

**`runAction` (`src/shared/lib/action/run.ts`) is the only way a client calls a Server Action.** It
awaits the `ActionResult`, turns a thrown transport into `UNEXPECTED` with the original logged, and
raises the toast — so the fourth call site written cannot forget any of the three. `runOptimistic`
and `useFormSeam` route their write through it; a call made straight from an event handler uses it
directly.

**Review holds this, not lint** — Biome cannot tell a Server Action from any other async function.

**Options are grouped by subject, not spread flat.** Everything about the toast is
`toast: { scope, isEnabled, successMessage }`, typed as `ActionToastOptions` and taken by
`runOptimistic` under the same name; everything `runOptimistic` writes to the store is
`data: { optimisticPatch, claimedFields, sourceVersion, successPatch, failurePatch,
rolledBackFields, settledPatch }`.

**`scope` decides which failures are spoken**, and the rule is that whatever already draws a
failure owns it:

| Caller | Scope | Why |
| --- | --- | --- |
| A bare `runAction` from an event handler | `UNPLACED` (the default) | Nothing holds the failure, but a field or a footer might |
| `runOptimistic`, and any form | `NONE` | The store records every failure and the surface draws it |
| A write whose surface may be gone when the answer lands | `ALL` | A row already removed from the list that held it |

`isSilent` and `toast: { isEnabled: false }` raise nothing at all, success included.
`toast.successMessage` is the only thing that confirms a success, and it is unaffected by the scope —
a confirmation has nowhere else to go.

**The deadline speaks for itself.** `runOptimistic`'s timeout is the one failure nothing is
awaiting, so `runAction` never reaches it; it calls `raiseFailure` from the timer under the same
option group, or a stalled write is recorded against a key nothing renders and said nowhere.

**Two `runAction` calls nest** wherever a form's write is an optimistic one — the form seam wraps
`runOptimistic`, which wraps the action. Both take `NONE`, so neither speaks. Where a caller
overrides only one of the two, the toast id is the code and the library replaces rather than stacks,
so one sentence still reaches the screen.

## Reads

A read is a plain async function, `import 'server-only'` at the top, the minimal shape its callers
need — not the whole Payload document. Which directive it carries follows who the answer depends
on (ADR-0018):

- **The same for every caller** — `'use cache'` + `cacheTag(...)` + `cacheLife('days')`, the
  default. A read the shell may hold prerenders this way; the same read inside a live Suspense hole
  carries `'use cache: remote'` instead, which is never prerendered.
- **Depends on the caller** — `'use cache: private'` + `cacheLife('hours')`: request-scoped on
  the server, held in the browser's own router cache for `stale`, never a shared store.
  `getCurrentUser` (`src/api/user/getCurrentUser.ts`) carries this; every later
  per-User read copies it. `tests/api/cacheLeakGuard.test.ts` guards a `'use cache'` file under
  `src/api/` from importing the session module.
- **Anything else** stays uncached, inside the `Suspense` boundary the view that needs it owns —
  the view wraps its own dynamic zone with `Loader` as the fallback
  (`docs/features/loader-and-rule.md`); `ProfilePage` wrapping `ProfileSection` is the pattern.

On Vercel, the platform's Data Cache holds `'use cache'` and `'use cache: remote'`; `private` never
lands there.

**An admin edit in `/cms` purges the same tags.** `withCacheTagHooks`
(`src/collections/revalidateCacheTags.ts`) appends `afterChange` and `afterDelete` hooks calling
`revalidateTag(tag, 'max')` for the record and the collection; `users` carries it, and a collection
gains it with its first cached read, after an entry in `RECORD_TAG_PREFIX` — the helper throws at
config time without one. Outside a request — `yarn seed`, a migration — the call throws and
is logged, never rethrown.
