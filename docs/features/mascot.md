# Mascot

How a "nothing here" surface gets its dragon, and what it costs a page that never shows one. The
drawing itself — classes, tokens, how a new pose is labeled — is `design/mascot.md`; the surfaces
that carry it are `docs/features/site-layout.md`.

## The mechanism

- **`<Mascot pose>` in `shared/components/Mascot/`** is the one entry. `aria-hidden` always; the
  root holds a viewport-scaled default size, and a `size-*` in `className` replaces it. The pose
  names and the surface each one serves are on `MASCOT_POSE` in `src/constants/mascot.ts`.
- **An SVG import is a component.** The Turbopack rule in `next.config.ts` runs `@svgr/webpack`
  with svgo inside, and says why each svgo option is set. `src/types/svg.d.ts` types the import
  for the assets folder only — Next's own `*.svg` declaration is `any`, and the longer pattern
  wins.
- **The Theme is a stylesheet, not a prop.** `src/styles/mascot.css` fills each class from the
  `--mascot-*` tokens, and `<html data-theme>` picks the values — the component never asks which
  Theme is active.

## What a page pays

- **Each pose is its own client chunk**, fetched the first time a `<Mascot>` with that pose
  mounts; the other three are never requested. The map of `next/dynamic` imports in the
  component is what makes that so — a static import in `error.tsx` would land the drawing in the
  chunk Next preloads on every page.
- **`Mascot` is a client component for the payload, not the browser.** Next ships a page's
  `not-found`, `unauthorized` and `forbidden` trees with the page, so a pose rendered on the
  server rides into every page as markup — measured at 50 KB gzipped on the home page. As a
  client reference it is a name until the boundary shows.
- **Check against the built output:** a pose chunk is the file under `.next/static/chunks/`
  holding `belly-shade` — a class, which svgo keeps; ids it renames. The home page HTML under
  `.next/server/app/` names none of them.
- **A chunk in flight or lost costs the surface nothing.** `loading` on each `dynamic` is what
  gives the chunk its own Suspense under the App Router — without it the whole boundary suspends
  — and `SilentBoundary` around the drawing turns a failed fetch into an empty box.

## Under Vitest

`vitest.config.ts` aliases every `.svg` import to `tests/fixtures/svg.tsx`, an empty `<svg>` that
carries the props. A test asserts on what wraps the drawing; color and the hidden `detail` group
are checked in the browser.
