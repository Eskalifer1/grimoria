# Pattern D — the surface replaced

The whole surface is taken over by a blocking state, because nothing partial is worth showing. Which
pattern a surface gets is `docs/features/data-access.md`; this file is everything needed to build
one.

## When, and it is rarely

**Only once every other pattern is out.** Two cases earn it: a read whose staleness is unacceptable,
and a failure with no way forward on the surface itself. A failure a User could dismiss and carry on
past is not this pattern.

## It replaces the surface without moving it

The surface and the block share one grid cell, so the box is as tall as the taller of the two
whatever is showing. The hidden one keeps its space — `invisible` rather than unmounted — and is
`inert`, so it holds that space without being reachable or read out. Unmounted instead, taking over
and handing back would shift everything below the surface twice.

**The block is one `EmptyState`** (`shared/components/EmptyState/`) — the same leaf a 404 and an
empty list draw through — titled `optimistic.pending` while waiting, and `optimistic.problem` over
the worded failure, with the `action`, once failed.

## The shape

```tsx
'use client';

<BlockingView action={<button onClick={retry} type="button">{t('retry')}</button>}
  error={failure} status={status}>
  {children}
</BlockingView>
```

- `status` is `ACTION_STATUS.IDLE | PENDING | SUCCESS | FAILURE` from `src/constants/action.ts`.
- `error` is the failure to word, `{ code, fields }`. **A `FAILURE` with no `error` still blocks**,
  worded generically — a blocking view with nothing to say would be a blank screen.
- `action` is the way out. Omit it only where there genuinely is none.

## What it holds so a surface cannot get it wrong

**Flight waits 200 ms before it blocks anything**, and a failure blocks immediately.
`<BlockingView>` owns the threshold, so a read that answers in 100 ms never replaces the surface.

**A surface it has already taken over is never handed back until an answer lands.** The threshold
guards a working surface; a retry from a blocked one blocks at once, or the value the retry is
correcting flashes up for 200 ms and is taken away again.

**The blocked states announce themselves** — `role="alert"` with `aria-busy` on the wait,
`role="alert"` on the failure. A settled surface announces nothing.

## Where it is used

**No product surface uses this pattern yet**, and there is no worked example left in the tree — the
dev playground that held one went with the mock. `tests/shared/components/BlockingView.test.tsx` is
what the shape has to be read off until a real blocking read lands. The route-level `error.tsx` and `not-found.tsx` files are the framework's own version of the same idea;
`<BlockingView>` is for a region inside a page that has to block on its own.
