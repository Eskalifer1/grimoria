import { describe, expect, it } from 'vitest';

import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { OPTIMISTIC_ERROR, PENDING_ACTION } from '@/constants/optimistic';
import { clientFailure, emptyEntry } from '@/shared/lib/optimistic/entry';
import { entryError, entryStatus, fieldError, fieldPending } from '@/shared/lib/optimistic/read';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

const AT = 10;

function opened(fields?: readonly string[], call = 1) {
  return beginEntry(null, { action: PENDING_ACTION.UPDATE, fields }, call, AT);
}

/** Two attempts against one field, the second replacing what the first recorded. */
function failedTwice() {
  const once = settleFailureEntry(
    opened(['title']),
    { error: { code: ACTION_ERROR.CONFLICT, fields: { title: ['taken'] } } },
    1,
    AT,
  );

  return settleFailureEntry(
    beginEntry(once, { action: PENDING_ACTION.UPDATE, fields: ['title'] }, 2, 20),
    { error: { code: OPTIMISTIC_ERROR.INTERRUPTED } },
    2,
    20,
  );
}

describe('entryError and fieldError', () => {
  it('answer nothing when there is no entry at all', () => {
    expect(entryError(null)).toBeNull();
    expect(fieldError(null, 'title')).toBeNull();
  });

  it('answer nothing for an entry that never failed', () => {
    expect(entryError(emptyEntry(AT))).toBeNull();
    expect(fieldError(emptyEntry(AT), 'title')).toBeNull();
  });

  it('answer the latest attempt, not the first', () => {
    expect(entryError(failedTwice())?.code).toBe(OPTIMISTIC_ERROR.INTERRUPTED);
  });

  it('separate what a form places beside an input from what it shows above the form', () => {
    const failed = settleFailureEntry(
      opened(['title']),
      { error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['too short'] } } },
      1,
      AT,
    );

    expect(fieldError(failed, 'title')?.code).toBe(ACTION_ERROR.INVALID_INPUT);
    // Filed under `title` as bookkeeping, but the server never named `body`.
    expect(fieldError(failed, 'body')).toBeNull();
    expect(entryError(failed)?.code).toBe(ACTION_ERROR.INVALID_INPUT);
  });
});

describe('fieldPending', () => {
  it('answers the kind of write the field is under', () => {
    expect(fieldPending(opened(['title']), 'title')).toBe(PENDING_ACTION.UPDATE);
    expect(fieldPending(opened(['title']), 'body')).toBeNull();
  });

  it('covers every field when the write claimed none — a delete owns the whole row', () => {
    const deleting = beginEntry(null, { action: PENDING_ACTION.DELETE }, 1, AT);

    expect(fieldPending(deleting, 'title')).toBe(PENDING_ACTION.DELETE);
  });

  it('answers nothing once the write has settled', () => {
    expect(fieldPending(failedTwice(), 'title')).toBeNull();
    expect(fieldPending(null, 'title')).toBeNull();
  });
});

describe('entryStatus', () => {
  it('reads flight first, then the failure, then the fact that anything is stored', () => {
    const entry = emptyEntry(AT);
    const failure = clientFailure(ACTION_ERROR.CONFLICT);

    expect(entryStatus(null, null, null)).toBe(ACTION_STATUS.IDLE);
    expect(entryStatus(entry, null, null)).toBe(ACTION_STATUS.SUCCESS);
    expect(entryStatus(entry, null, failure)).toBe(ACTION_STATUS.FAILURE);
    expect(entryStatus(entry, PENDING_ACTION.UPDATE, failure)).toBe(ACTION_STATUS.PENDING);
  });
});
