# Responsive standard

What adapts to the viewport and what adapts to its container, and the fixed rules that hold
regardless — touch targets, safe areas, viewport units, text. Styling mechanism is `styling.md`;
token values are `src/styles/tokens.css`.

## Breakpoints

Tailwind's own, mobile-first, `sm:` upward. One viewport breakpoint governs the shell: at `lg` the
drawer becomes the persistent sidebar (`docs/features/site-layout.md`); below it the drawer holds.
The rail is the User's collapse choice, never a breakpoint. A form goes full-width below `sm`.
`md` (768) keeps the drawer — a tablet in portrait or an open foldable, where sidebar plus content
does not fit.
Held by review.

## Viewport vs container

Viewport queries are for the shell alone — drawer vs sidebar, form width, `hover`/`pointer`/
`prefers-*`. Anything that can live in more than one slot — a Note grid, a card, a form row — is a
`@container` and sizes off `@sm:`/`@lg:`. **A component never reads the viewport width.** A
masonry grid is a plain grid whose column count comes from the container; `display: grid-lanes`
is experimental and not used.
Held by review.

## Touch targets

24×24 CSS px floor everywhere (WCAG 2.2 AA, 2.5.8); under `pointer-coarse:` every interactive
element is 44×44. Hit area grows by padding, never the glyph. **The padding lives in the `ui/`
primitive** — `button`, `checkbox`, `switch`, `select`, `input` — written once per size variant;
a feature component never carries `pointer-coarse:` itself. Text inside a sentence is exempt
(2.5.8). Hover is an enhancement: every action a hover reveals is also reachable without it.
Held by `tests/styles/touchTargets.test.ts` for the primitives, and review with `browser-check`'s
target-size measurements for what is built from them.

## Safe areas

Root layout exports `viewport.viewportFit = 'cover'`; without it every `env(safe-area-inset-*)`
resolves to 0 (`browser-check`'s safe-area probe catches a regression — `.claude/agents/browser-check.md`).
A surface touching a screen edge — drawer, sticky footer, toast, bottom action bar, full-bleed
header — pads with `env(safe-area-inset-*)` on that edge, as `max(<step>, env(…))` or
`calc(<step> + env(…))`.

## Viewport units

`min-h-svh` for a screen that must fit on first paint; `h-dvh` only on the app shell and a bottom
sheet, where re-laying out as the URL bar moves is wanted. `h-screen`, `min-h-screen`,
`max-h-screen`, and any bare `vh`/`lvh` length are not written — `tests/styles/viewportUnits.test.ts`
rejects them under `src/`. A fixed `height` only on a box that scrolls
internally or an `aspect-ratio` media box; never on a box holding wrapped text.

## Text

Prose is capped at `max-w-prose` (65ch); a long token breaks with `overflow-wrap: anywhere` and
`min-w-0` on the flex child; a heading takes `text-wrap: balance`. `truncate`/`line-clamp-*` only
where the full text is reachable elsewhere, never on the only copy of a control's name. Every
input's computed font size is at least 16px — a smaller size lives under `pointer-fine:`, never
under a breakpoint (`tests/styles/touchTargets.test.ts`).
Held by review, with `browser-check`'s clipped-text and input-size measurements as the evidence.

## Radius

Fixed per component; it does not scale with the viewport.
Held by review.

## The two scales

Fluid type (`--text-*`) and the space palette (`--spacing-3xs` … `--spacing-3xl`, plus the
pairs `sm-lg`, `md-lg`, `lg-xl`, `xl-2xl`) both interpolate 320px → 1536px in `tokens.css` — no component writes its own
`clamp()`. The space palette is for the air around things: section gaps, page gutters, card and
dialog padding. Everything inside a component — gaps between its items, icon sizes, control
heights, sidebar width, touch targets — stays on Tailwind's 4px `--spacing` scale, unchanged.
A media box outside both — the Mascot — writes its own `clamp()` over the same range, and its
preferred term pairs `rem` with `vw` like the scales do.
Held by `tests/styles/tokens.test.ts` — the `clamp()` shape, the `rem + vw` term, the step order —
and by `tests/styles/viewportUnits.test.ts` for a `clamp()` written in a component.

## Verifying it

The viewport list `browser-check` opens at each surface it reviews is
`.claude/agents/browser-check.md`, not repeated here.

## Out of scope

Style/scroll-state queries, `interpolate-size`, scroll-driven animations, foldable dual-segment
layouts.
