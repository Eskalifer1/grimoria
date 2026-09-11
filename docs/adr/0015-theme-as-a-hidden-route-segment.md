# The Theme is a hidden route segment

Every frontend route renders under `src/app/(frontend)/[theme]/[locale]/`. `src/proxy.ts` rewrites an
incoming request onto that internal path, `generateStaticParams` prerenders the
`THEMES × routing.locales` product, and the visible URL never carries a Theme — a rewrite is not a
redirect, the same way next-intl already hides `/en`.

A Theme in the URL is a value the router can enumerate; the cookie it replaced had no list to
prerender against, and reading it in the root layout made every route under it `ƒ`.

**`src/i18n/request.ts` reads both segments through `next/root-params`.** Route params reach route
files only, and next-intl calls that module, so nothing can pass it a prop. The compiler generates
those accessors from the root layout's own dynamic segments, and reading one is not a request read,
which is what keeps the page static. It needs `experimental.rootParams` in `next.config.ts` today.

**No `(frontend)` layout reads the session.** `getCurrentUser()` there is a cookie read and a
database call, and the only thing that needed it was the scope `OptimisticScope` sets. That scope
travels in a second cookie the client reads itself, during its first render, with no network round
trip.

**One Better Auth plugin writes both cookies** (`src/auth/`), matching on `ctx.context.newSession`
rather than on a list of paths, so a later sign-in method cannot be missed. The Theme cookie is
long-lived and survives sign-out — a Theme is a device preference, and it also words the sign-out
screen. The scope cookie carries the User id, is readable by JavaScript, and takes the session's own
expiry.

**`user.theme` stays the stored truth; the cookie is what renders**, so the proxy reads one cookie
for everyone and makes no database call. #78 owns the toggle and writes both places at once.

Rejected: folding the Theme into the locale as `en-dark-fantasy`. One segment instead of two, at the
cost of making `<html lang>` a lie, which breaks hreflang (#93) and a second locale (#18).

## Costs accepted

- **Build output multiplies by `themes × locales`.** Dynamic routes are unaffected — they generate
  nothing at build — and a route that outgrows this moves to ISR with a partial
  `generateStaticParams`.
- **A Theme changed away from this device reaches it at the next session write.** Editing
  `user.theme` in Payload's admin does not repaint the current browser: the render path reads the
  cookie and never the database.
- **The internal path is a second address for one page**, closed by a 308 to the clean URL rather
  than a 404, which would punish whoever clicked a real link.
- **A session revoked from another device leaves a stale scope cookie.** It names a `localStorage`
  slot and unlocks no data.
- **`src/app/layout.tsx` may never exist.** A layout above `[theme]/[locale]` becomes *the* root
  layout, which leaves those segments with nothing to generate accessors from — the build fails on
  `Export theme doesn't exist in target module`. ADR-0016 covers what this costs the boundary
  surfaces.
- **Metadata may not call `t()`.** Both prerendered Themes have to emit an identical `<head>`, or a
  shared link preview would depend on the Theme of whoever copied the link.
