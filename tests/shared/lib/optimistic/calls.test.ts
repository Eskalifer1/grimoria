import { describe, expect, it } from 'vitest';

import { PENDING_ACTION } from '@/constants/optimistic';
import { nextCall, ownedByCall } from '@/shared/lib/optimistic/calls';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { beginEntry } from '@/shared/lib/optimistic/transitions';

const NOW = 1_700_000_000_000;

/** An entry with one write open per field named, each under its own call number. */
function opened(...writes: [field: string, call: number][]): OptimisticEntry {
  let entry: OptimisticEntry | null = null;

  for (const [field, call] of writes) {
    entry = beginEntry(
      entry,
      { action: PENDING_ACTION.UPDATE, optimisticData: { [field]: 'x' } },
      call,
      NOW,
    );
  }

  return entry as OptimisticEntry;
}

describe('nextCall', () => {
  it('counts above the store and above the entry alike', () => {
    // An entry adopted from another tab carries that tab's numbering, and starting
    // under it would have this tab's own answer discarded as stale.
    expect(nextCall(3)).toBe(4);
    expect(nextCall(3, opened(['title', 9]).latestCall)).toBe(10);
  });
});

describe('ownedByCall', () => {
  it('measures a write that named no field against the key', () => {
    const entry = opened(['title', 1], ['title', 2]);

    expect(ownedByCall(entry, 1, undefined)).toBeNull();
    expect(ownedByCall(entry, 2, undefined)).toEqual({ fields: undefined, superseded: [] });
  });

  it('reads an empty list the same as no list at all', () => {
    // A delete owns the row, not one of its values, and `runOptimistic` spells
    // that as `fields: []`.
    expect(ownedByCall(opened(['title', 1]), 1, [])).toEqual({
      fields: undefined,
      superseded: [],
    });
  });

  it('leaves a field still in flight to its own answer', () => {
    const entry = opened(['title', 1], ['body', 2]);

    expect(ownedByCall(entry, 1, ['title'])).toEqual({ fields: ['title'], superseded: [] });
    expect(ownedByCall(entry, 2, ['body'])).toEqual({ fields: ['body'], superseded: [] });
  });

  it('discards an answer whose every field a newer write has taken over', () => {
    const entry = opened(['title', 1], ['title', 2]);

    expect(ownedByCall(entry, 1, ['title'])).toBeNull();
  });

  it('keeps the half of an answer a newer write did not take', () => {
    // The case a whole-or-nothing guard gets wrong: `body` is still this call's,
    // so the answer lands — and settling `title` with it would put the value the
    // User has already replaced back on screen.
    const entry = beginEntry(
      beginEntry(
        null,
        { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A', body: 'A' } },
        1,
        NOW,
      ),
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } },
      2,
      NOW,
    );

    expect(ownedByCall(entry, 1, ['title', 'body'])).toEqual({
      fields: ['body'],
      superseded: ['title'],
    });
  });

  it('falls back to the key for a field nobody owns', () => {
    const entry = opened(['title', 1], ['title', 2]);
    const settled = { ...entry, fieldCalls: {} };

    // Its owner was retired by an answer. Defaulting to zero would let the answer
    // that answer replaced land afterwards as the current one.
    expect(ownedByCall(settled, 1, ['title'])).toBeNull();
    expect(ownedByCall(settled, 2, ['title'])).toEqual({ fields: ['title'], superseded: [] });
  });
});
