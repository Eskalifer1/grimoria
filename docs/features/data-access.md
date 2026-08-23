# Data access

How a screen reads from Postgres and writes back to it: where the code lives, what a Server Action
returns, and which mutation pattern a surface gets. Layer rules are
`docs/agents/coding-standards/layers.md`; who may do what is `docs/features/auth.md`. **#49 is
canonical for every decision here**, and #61 extracts `api-local.md` from this doc.

## Contents

- The `src/api/` layer
- Writing an action
- What a call answers with
- Which pattern a write gets
- Rollback versus keep
- Reads

## The `src/api/` layer

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
`handler`, and optionally `authorize` and `revalidatePaths`.

```ts
'use server';

const updateName = createProtectedAction({
  name: 'user.updateName',
  schema: updateNameSchema,
  revalidatePaths: [ROUTE_PATTERNS.PROFILE],
  handler: async ({ input, user, payload }) => { /* the write, with overrideAccess: false */ },
});
```

- **One exported action per `"use server"` file, and nothing else — not a schema, not a type.** Every
  export of such a file is a public endpoint reachable with arbitrary arguments, and the loader that
  rewrites the file leaves a broken reference behind for an export that is not an async function.
  The schema lives beside it in `<action>Contract.ts`, which promotes to a shared module on its
  second consumer.
- **A handler refuses by throwing an `ActionError`** carrying a code (`notFoundError()`,
  `forbiddenError()`); the wrapper turns it into the failure member. Anything else that throws is a
  defect: logged server-side, returned as `UNEXPECTED`.
- **`authorize` decides the right, the collection still decides access.** Writes pass
  `overrideAccess: false` and the session `user`, so Payload's own rules run underneath. Roles are
  asked through `src/api/core/permissions.ts` — `role` is a list, so `user.role === 'admin'` is
  always wrong.
- **`revalidatePaths` takes `ROUTE_PATTERNS`, never `ROUTES`.** Next matches the route as it is
  declared, and every page sits under `[locale]`, so `/profile` matches nothing and the screen keeps
  reading stale data. A failing revalidation is logged and the call still answers success — the row
  is written, and a failure there would show the User an outcome the database disagrees with.
- **A read is a plain async function**, not an action: no directive, `import 'server-only'` at the
  top, the minimal shape returned.

## What a call answers with

**Every call resolves to `ActionResult<TData>`** (`src/shared/lib/actionResult.ts`) — a union on
`status`, built by `actionSuccess`/`actionFailure`, never a throw across the client boundary. Both
members declare `data` and `error`, one of them `null`.

**A failure is a code, never a message**: `ACTION_ERROR` in `src/constants/action.ts` holds the codes
any call can answer with, each with copy under `actionError` in both catalogs, so a Theme words the
failure. `useActionErrorMessage()` turns a failure into a sentence, and an unknown code reads as the
generic one rather than reaching a User raw. A validation failure also carries `fields` — the schema's own
messages per field path, in English and outside `messages/`, so they are a server-side diagnostic
and not something a surface renders. A form places its own copy beside the input, keyed by the
field; localized field errors are #97, with the schema.

## Which pattern a write gets

```
Does this touch the server?
|- no  -> no pattern needed
`- yes
   |- READ  -> read rules (below)
   `- WRITE
      Can the server's response be anticipated?
      |- no  -> C: blocking form
      `- yes
         Does the User need to know the outcome?
         |- no  -> A: optimistic without feedback
         `- yes -> B: optimistic with feedback
                   editing existing data -> roll back, show the error
                   creating new data     -> keep it, mark it failed
```

| Pattern | When | Behavior |
| --- | --- | --- |
| **A — optimistic, no feedback** | The response is predictable and the User need not learn it succeeded | Instant update; a failure rolls back silently |
| **B — optimistic, with feedback** | The response is predictable but the User must learn about a failure | Instant update; a failure surfaces a dismissible error at the element |
| **C — blocking form** | The response cannot be anticipated: server-side validation, a server-generated identifier, uniqueness, anything moving money | Submit disabled with a pending state; nothing optimistic |

This app has no offline support, so a write is optimistic or blocking.

## Rollback versus keep

**An edit of existing data rolls back on failure** and shows the error, so the User is never left
looking at a value the server did not store. **A create keeps its data and is marked failed**,
because rolling back would discard text the User just typed.

`src/shared/hooks/useOptimisticAction.ts` carries this as `failureBehavior`, from
`FAILURE_BEHAVIOR`. **The settled outcome is held against the `value` it was computed from**, so the
server's confirmed value stays on screen after the transition and a fresher prop — the revalidation
landing, an edit made elsewhere — supersedes it, error included. The transition it performs — `PENDING -> SUCCESS | FAILURE` — is pure and lives
apart from React in `src/shared/lib/optimisticState.ts`, and `run` resolves with the action's own
result for a caller that needs the payload.

Two rules come with that snapshot:

- **The latest `run` owns the screen.** Each call takes a number, and a response arriving after a
  later call — or after `reset` — resolves its own promise and writes nothing, so a slow first write
  cannot overwrite a fast second one.
- **A failure outlives the value that produced it.** A fresher prop replaces what is on screen, but
  not the reason the last write did not land — only `reset` or the next `run` clears that. A
  revalidation arriving mid-flight must not be how a User finds out their save was lost.
- **A `value` the render rebuilds needs `isSameValue`.** Whether the optimistic value still stands is
  decided by comparing the prop to the one it was computed against, `Object.is` by default. An
  object or a list compares unequal to itself and would drop what the User typed one render after a
  `KEEP` failure. **Compare over something that moves when the server value moves** — a version, an
  `updatedAt`. An id says "same row", not "same truth", and pins the old value on screen for as long
  as the row keeps its id.
- **A confirmed value is wrapped, not bare.** `successValue` answers `{ value }` so a `TValue` that
  includes `null` — an avatar cleared, a due date removed — can confirm `null` without it reading as
  "nothing was mapped". A mapper that throws is logged as the defect it is; the write is still
  reported as the success it was.
- **A handler may navigate.** `redirect` and `notFound` throw a sentinel Next has to see, so the
  wrapper rethrows it before it can be mistaken for a defect.

## Reads

- **Per-User data is never placed in a shared cache.** It is dynamic, resolved per request.
- **An action ends with `revalidatePath` for the route it changed**, so a reload agrees with what
  the screen showed, and the confirmed value replaces the optimistic one inside the same
  transition. Shared data moves to `'use cache'` + `cacheTag` + `updateTag` when Cache Components
  land (#95), which is when these call sites convert.
- **A read returns the minimal shape its callers need**, not the whole Payload document.
- **A read module starts with `import 'server-only'`** — `components.md` for why a Server Action
  file does not.
