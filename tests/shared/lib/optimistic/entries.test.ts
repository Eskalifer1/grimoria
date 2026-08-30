import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import {
  OPTIMISTIC_ENTRY_MAX_AGE_MS,
  OPTIMISTIC_ERROR,
  OPTIMISTIC_REQUEST_TIMEOUT_MS,
  PENDING_ACTION,
} from '@/constants/optimistic';
import {
  hasPendingEntry,
  isSameSnapshot,
  mergeExternal,
  nextDeadline,
  type OptimisticSnapshot,
  sweepEntries,
} from '@/shared/lib/optimistic/entries';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

const NOW = 1_700_000_000_000;

/** A write still out, opened at the moment given. */
function pending(at = NOW): OptimisticEntry {
  return beginEntry(
    null,
    { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } },
    1,
    at,
  );
}

/** A write that refused, so nothing about it is in flight any more. */
function failed(at = NOW): OptimisticEntry {
  return settleFailureEntry(
    pending(at),
    { error: { code: ACTION_ERROR.CONFLICT } },
    1,
    at,
  ) as OptimisticEntry;
}

describe('sweepEntries', () => {
  it('answers the same object when the clock settled nothing', () => {
    const entries: OptimisticSnapshot = { a: failed() };

    expect(sweepEntries(entries, NOW)).toBe(entries);
  });

  it('drops an entry nobody came back to', () => {
    // A refused write is never superseded by a render, so without an age nothing
    // ever clears an attempt nobody dismissed.
    expect(sweepEntries({ a: failed() }, NOW + OPTIMISTIC_ENTRY_MAX_AGE_MS + 1)).toEqual({});
  });

  it('gives up on a write that has run out of time', () => {
    const swept = sweepEntries({ a: pending() }, NOW + OPTIMISTIC_REQUEST_TIMEOUT_MS + 1);

    expect(swept.a?.pendingAction).toBeNull();
    expect(swept.a?.error?.code).toBe(OPTIMISTIC_ERROR.INTERRUPTED);
    // The value the User typed is not what a lost answer takes away.
    expect(swept.a?.patch).toEqual({ title: 'Typed' });
  });

  it('leaves a write that still has time', () => {
    const entries: OptimisticSnapshot = { a: pending() };

    expect(sweepEntries(entries, NOW + OPTIMISTIC_REQUEST_TIMEOUT_MS - 1)).toBe(entries);
  });
});

describe('hasPendingEntry', () => {
  it('answers false for an empty store', () => {
    expect(hasPendingEntry({})).toBe(false);
  });

  it('answers false when every entry has settled', () => {
    expect(hasPendingEntry({ a: failed(), b: failed() })).toBe(false);
  });

  it('answers true while any one key is still writing', () => {
    expect(hasPendingEntry({ a: failed(), b: pending() })).toBe(true);
  });
});

describe('nextDeadline', () => {
  it('answers nothing when no write is out', () => {
    expect(nextDeadline({ a: failed() })).toBeNull();
  });

  it('answers the soonest of the writes that are', () => {
    expect(nextDeadline({ a: pending(NOW + 5), b: pending(NOW) })).toBe(
      NOW + OPTIMISTIC_REQUEST_TIMEOUT_MS,
    );
  });
});

describe('mergeExternal', () => {
  it("takes the other tab's document for a key this tab is not writing", () => {
    const merged = mergeExternal({ a: failed() }, { a: pending() }, () => false);

    expect(merged.a?.pendingAction).toBe(PENDING_ACTION.UPDATE);
  });

  it('adopts a key the other tab dropped, which is what carries a dismissal across', () => {
    expect(mergeExternal({ a: failed() }, {}, () => false)).toEqual({});
  });

  it('keeps a write this tab has in flight, which the other tab could not know about', () => {
    const mine = pending();

    expect(mergeExternal({ a: mine }, {}, (key) => key === 'a').a).toBe(mine);
  });

  it("adopts a settle for a pending entry that is not this tab's", () => {
    // Read out of the slot rather than issued here. Held as ours it would make
    // this tab ignore the very document that ends it, and the row would stay dim
    // until the deadline.
    const merged = mergeExternal({ a: pending() }, { a: failed() }, () => false);

    expect(merged.a?.error?.code).toBe(ACTION_ERROR.CONFLICT);
  });

  it('carries its own call numbering over, since none travels in the document', () => {
    const local = { ...pending(), latestCall: 7 };

    expect(mergeExternal({ a: local }, { a: pending() }, () => false).a?.latestCall).toBe(7);
  });
});

describe('isSameSnapshot', () => {
  it('compares by identity per key, because an entry is replaced and never mutated', () => {
    const entry = failed();

    expect(isSameSnapshot({ a: entry }, { a: entry })).toBe(true);
    expect(isSameSnapshot({ a: entry }, { a: failed() })).toBe(false);
    expect(isSameSnapshot({ a: entry }, { a: entry, b: entry })).toBe(false);
  });
});
