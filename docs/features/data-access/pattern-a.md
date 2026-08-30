# Pattern A — optimistic, silent

The write shows at once and nothing is ever said about it, in either direction. Which pattern a
surface gets is `docs/features/data-access.md`; this file is everything needed to build one.

## When it is allowed

**Only when losing the write costs the User nothing.** A collapsed sidebar section, a sort order —
the value goes back to what the server holds, nobody is told, and nothing was riding on it.

**The consequence decides, not the confidence.** A write you are sure will land, whose failure would
still leave the User believing something false, is not this pattern.

**A control the User will act on is not this pattern either.** A Theme toggle that quietly goes back
to light reads as a broken switch, not as a failed save. That is `onFailure: 'rollback'`, which says
why — and it is pattern B.

## The shape

`onFailure: 'silent'`, and ignore the result.

```tsx
'use client';

const density = useOptimisticValue({
  descriptor: setDensityOptimistic,
  input: { id: user.id },
  field: 'density',
  onFailure: 'silent',
  value: user.density,
  version: user.updatedAt,
});

<button onClick={() => void density.run('compact')} type="button">{t('compact')}</button>
```

`density.value` is the new value at once and the server's afterwards. **Nothing renders
`density.error`, `density.isPending` or a `<StatusDot>`** — a marker is what makes this pattern B.

**`onFailure: 'silent'` is not decoration.** It is what hands the field back on a refusal and
records no reason. Left at the default, the refused value crosses the reload that was supposed to
fix it, and its reason reaches every other surface on that key.

`version` is the server's `updatedAt`. It is what lets a confirmed overlay die once the render
catches up; leaving it out pins a stale value on screen.

## What stays true anyway

**Nothing is disabled.** The point of an optimistic write is that the User has already moved on.

**A key is never written by hand.** The call site hands over an input and the descriptor builds the
key; the store is unreachable from `app/`, `views/`, `features/` and `entities/`, and Biome refuses
the import.

## Where it is used

**No surface uses this pattern yet.** The candidates are the sidebar sections that arrive with the
site shell (#75). The Theme toggle is not one of them.

There is no worked example in the tree. `tests/shared/hooks/useOptimisticValue.test.tsx` — "records
nothing at all under `silent`" — is what the shape has to be read off until one lands.
