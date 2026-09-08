# A Content Security Policy without a nonce

`script-src` is `'self' 'unsafe-inline'`. The policy was built the other way first — a per-request
nonce minted in `src/proxy.ts`, `'strict-dynamic'`, no `'unsafe-inline'` — and that version was
removed before it merged.

Next stamps a nonce during server-side rendering, reading it from the `Content-Security-Policy`
header on the request. A page with no request has no nonce: prerendered HTML is built before any
request exists, so its `<script>` tags carry nothing, and under a nonce policy the browser refuses
every one of them. Next's docs state the consequence outright — a nonce means static rendering, ISR
and PPR are all off, for every page.

That was verified rather than assumed. On a production build, Next's built-in 404 came back with
fourteen script tags, not one carrying a nonce, and seventeen CSP violations in the console; the
page rendered its text and never hydrated. `/` was clean at seventeen of seventeen.

Static rendering is wanted. #110 exists to take the app off per-request rendering — ISR for notes,
static generation for the standing pages. A nonce would settle that question by removing the option,
which is the wrong order: the security header set is one ticket, the rendering strategy is an
architecture the whole app is built on.

## Costs accepted

- **An injected inline `<script>` executes.** `'unsafe-inline'` is what a nonce exists to remove, and
  this is the attack the policy no longer stops — a script reaching the page through a dependency or
  a rich-text field runs with the session. What still holds is where it can go: it cannot load from
  a third-party host, open a connection off-origin, rewrite `<base>`, or post a form somewhere else,
  and the page cannot be framed. Payload escapes rich text on output, and no user-supplied string is
  rendered as HTML today.
- **Reversing this costs the rendering strategy, not the header.** Re-adding the nonce is an hour in
  `securityHeaders.ts` and `proxy.ts`; making every page dynamic again is the expensive half. Revisit
  only alongside #110, never on its own.
- **A hash-based policy was not pursued.** It is the third option and would keep both properties, but
  Next's inline bootstrap content varies per page and per build, so the hashes cannot be computed
  where the header is written.
