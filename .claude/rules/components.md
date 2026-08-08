---
paths:
  - "src/views/**"
  - "src/features/**/components/**"
  - "src/entities/**/components/**"
  - "src/shared/components/**"
---

# Writing a component here

**Read `docs/agents/coding-standards/components.md` before building one.** It holds the
server/client rules, the state ladder, the composition ladder, and how props are documented.
This file is a reminder, not a substitute.

Four things that break silently — nothing fails, review passes, and the cost shows up later:

- **`views/` never carries `"use client"`.** It is a composition root: the directive pulls
  every feature and entity below it into the browser bundle. The page still renders — just
  larger and slower. Push the directive down to the leaf that needs the browser.
- **A server module starts with `import 'server-only'`.** Payload's Local API sits behind the
  same `@/` alias as a button, so a client import of a data module ships the query — and the
  secret it reads — to the browser. The package turns that into a build failure.
- **`Object.assign` carries no client boundary.** A compound component (`Card.Header`) lives
  entirely on one side of it. A server root with a client region is a `children` slot, not a
  compound component.
- **`&&` in JSX renders `0`.** `{comments.length && <List />}` prints a literal zero on an
  empty list. Close every conditional on `null`: `{comments.length ? <List /> : null}`.
