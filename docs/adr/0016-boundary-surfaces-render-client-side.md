# Boundary surfaces render client-side, and we accept it

`notFound()`, `unauthorized()` and `forbidden()` return an `__next_error__` RSC payload that carries
no layout. The document Next sends for those responses is empty — no `<html>` attributes, no
stylesheet, no copy — and the boundary's markup appears only once the client bundle runs. The status
code is correct; the initial HTML is not.

This is upstream [vercel/next.js#62228](https://github.com/vercel/next.js/issues/62228), open since
14.1.0. [PR #98455](https://github.com/vercel/next.js/pull/98455) renders the full not-found tree
server-side and is unmerged. **When it lands, this ADR is obsolete and nothing in `src/` changes.**

**A genuinely unmatched URL is the one path that does render server-side**, and it renders the
*root* `not-found` — which needs a root layout at `src/app/`. Adding one empties `next/root-params`
(ADR-0015) and fails the build with `Export theme doesn't exist in target module`. `[...rest]/page.tsx`
turns the unmatched URL into a `notFound()` call instead, trading the server render for the Themed
surface. next-intl prescribes that same catch-all.

Rejected as the 404 for the localized tree: `app/global-not-found.tsx`. It returns full server
HTML at a 404, and it renders outside every layout by design — no Theme, no locale. next-intl's own
example hardcodes `lang="en"`. **It is mounted anyway, for what the catch-all cannot reach**: a path
the proxy matcher skips as a file (`/notes/a.b`) never enters `[theme]/[locale]`, and without it
that path gets Next's own unstyled screen. It carries hoisted English and `STANDARD_FONT_VARIABLES`,
as `global-error.tsx` does.

Rejected: rewriting unknown paths in `src/proxy.ts` onto a real route with
`NextResponse.rewrite(url, { status: 404 })`. It server-renders correctly, and it is a second router
for failures running beside Next's own — plus 401 would make the proxy validate a Better Auth
session on every request. [#50155](https://github.com/vercel/next.js/issues/50155) also disputes
whether the status survives.

## Costs accepted

- **A crawler reading the raw 404 document sees an empty body.** The status code is still 404, which
  is what a crawler acts on. Revisit when #93 lands `robots.ts`.
- **A `beforeInteractive` script never runs on a boundary surface.** Nothing uses one.
- **The first painted frame on a boundary is unstyled**, then `standard` light, then the active
  Theme — the tokens hang off a bare `:root`. Measured CLS is 0.0004 against a 0.1 budget, so this
  is repaint, not layout shift. Moving both Themes onto an explicit `[data-theme]` would fix it and
  reverses ADR-0015's reason for the default.
- **`error.tsx` renders client-side by contract**, not by this defect, and is unaffected when the
  upstream fix lands.
