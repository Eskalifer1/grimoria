# Security headers

What every response promises a browser, and why the policy stops where it does. Who may reach a
surface at all is `docs/features/auth.md`.

The set is built in `src/constants/securityHeaders.ts` — read the values there — and sent from
`next.config.ts`'s `headers()`. Two scopes: `'admin'` is `/cms` and `/api`, `'app'` is everything
else.

## Where the set lives, and in what order

**`headers()` lists `/:path*` first and the two Payload paths last.** Next applies **every** rule
that matches and the last write of a key wins, so the Payload paths — which match the app rule too —
have to come after it or their looser policy is overwritten and the admin stops loading.

**`src/proxy.ts` sends no header.** Nothing in the set varies per request, so all of it is static
and belongs in the config, which also reaches `_next` and the static files the proxy's matcher
excludes.

**One `Content-Security-Policy` per response.** Two enforcing policies intersect, and the result
blocks what either allows alone.

`securityHeaders.ts` imports nothing but its sibling `env.public.ts` — it loads at Next's config
time, where `env.ts`'s boot parse cannot run.

## What varies

**HSTS is production only.** In development it would pin `localhost` to https for every project on
the machine. `preload` is absent deliberately: submitting the domain is close to irreversible and is
a post-launch decision.

**`upgrade-insecure-requests` is production only.** Browsers exempt `localhost` from the upgrade but
not a LAN address, and a dev build reached over one has no TLS to be upgraded to.

**Development adds `'unsafe-eval'` and `ws:`**, which the dev server's HMR needs.

**The admin scope adds `'unsafe-eval'` and `worker-src 'self' blob:`** — Payload's admin evaluates
its field configuration and loads workers from a blob. Framing and sniffing stay denied there.

## Why there is no nonce

**`script-src` keeps `'unsafe-inline'`, and an injected inline `<script>` is what that leaves open.**
A nonce would close it and take static rendering, ISR and PPR with it — ADR-0014 has the reasoning
and the measurement, and #110 is the rendering strategy it defers to. Revisit the two together.

## Verifying a change

`tests/constants/securityHeaders.test.ts` covers the scope and environment branches. The set itself
is only observable on a real response — `yarn build && yarn start`, then read the headers on `/` and
on `/cms`.

Deferred: `report-uri`/`report-to` until Sentry (#41) lands, so a policy blocking something is
invisible until a User says so; the HSTS preload submission; an e2e assertion on the set (#39).
