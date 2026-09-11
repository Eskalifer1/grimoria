# The mascot is a client component, for the payload rather than the browser

`<Mascot pose>` carries `"use client"` and loads each pose through `next/dynamic`, although it
uses no browser API and every surface it sits on but `error.tsx` and `BlockingView` is a Server
Component. `docs/features/mascot.md` holds the mechanism.

**Next ships a segment's `not-found`, `unauthorized` and `forbidden` trees with every page** as
the boundaries' fallbacks. A pose rendered on the server is markup inside those trees, so it rides
into every response under `[locale]`. Measured on the built home page: 181 KB / 52 KB gzipped with
a server-rendered mascot on the three boundaries, 34 KB / 5.9 KB gzipped with the mascot as a
client reference — a name in the payload until the boundary shows, then one chunk of 19–27 KB
gzipped for the pose that renders and none for the other three.

Rejected: a server-rendered mascot. It ships no script and needs no hydration, and it costs 46 KB
gzipped of markup on every page for a drawing the page never shows.

Rejected: a static import per surface. `error.tsx` is a client file Next preloads on every page,
so the `sad` drawing would be in every page's initial JavaScript.

## The labeling tools live in one commit

The scripts that turned the four traces into labeled poses — `scripts/mascot/` — were committed
in `7c75013` and deleted right after, so the tree carries no tooling that runs once a year.
`design/mascot.md` states what they do; for the next pose, restore them from that commit
(`git checkout 7c75013 -- scripts/mascot`) rather than redo them by hand.

## Costs accepted

- **On a boundary surface the drawing arrives after hydration**, not in the first HTML. The root
  keeps its box while the chunk is in flight, so nothing shifts; the drawing pops in. ADR-0016
  already makes these surfaces client-rendered, so today no first frame is lost that was there.
- **Two instances of the same pose on one page share ids** — svgo's `prefixIds` is per file. The
  definitions are byte-identical, so the first resolves for both and renders the same.
