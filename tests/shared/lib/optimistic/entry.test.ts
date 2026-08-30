import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import {
  clientFailure,
  emptyEntry,
  isEntryFailed,
  isEntryLive,
  isEntryPending,
  NO_ATTEMPT,
  OPTIMISTIC_ENTRY_PERSISTENCE,
  type OptimisticEntry,
} from '@/shared/lib/optimistic/entry';

const NOW = 1_700_000_000_000;

function entry(overrides: Partial<OptimisticEntry> = {}): OptimisticEntry {
  return { ...emptyEntry(NOW), ...overrides };
}

describe('isEntryPending', () => {
  it('is true while the record or any of its fields is in flight', () => {
    expect(isEntryPending(entry({ pendingAction: PENDING_ACTION.UPDATE }))).toBe(true);
    expect(isEntryPending(entry({ pendingFields: { title: PENDING_ACTION.UPDATE } }))).toBe(true);
    expect(isEntryPending(entry())).toBe(false);
  });
});

describe('isEntryFailed', () => {
  it('is true for a failure on the record or on any of its fields', () => {
    expect(isEntryFailed(entry({ error: clientFailure(ACTION_ERROR.CONFLICT) }))).toBe(true);
    expect(
      isEntryFailed(entry({ fieldErrors: { title: clientFailure(ACTION_ERROR.CONFLICT) } })),
    ).toBe(true);
    expect(isEntryFailed(entry())).toBe(false);
  });
});

describe('isEntryLive', () => {
  it('is false only when nothing is pending, failed or overlaid', () => {
    expect(isEntryLive(entry({ patch: { title: 'Typed' } }))).toBe(true);
    expect(isEntryLive(entry({ pendingAction: PENDING_ACTION.ADD }))).toBe(true);
    expect(isEntryLive(entry({ error: clientFailure(ACTION_ERROR.CONFLICT) }))).toBe(true);
    expect(isEntryLive(entry())).toBe(false);
  });
});

describe('clientFailure', () => {
  it('files under no attempt, so it never correlates with a call the store made', () => {
    expect(clientFailure(ACTION_ERROR.INVALID_INPUT)).toEqual({
      code: ACTION_ERROR.INVALID_INPUT,
      fields: null,
      attempt: NO_ATTEMPT,
    });
  });
});

describe('the persistence decision map', () => {
  it('names every field of an entry, so a new one cannot be added without deciding', () => {
    expect(Object.keys(OPTIMISTIC_ENTRY_PERSISTENCE).sort()).toEqual(Object.keys(entry()).sort());
  });
});
