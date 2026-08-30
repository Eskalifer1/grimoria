import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_ERROR, PENDING_ACTION } from '@/constants/optimistic';
import { NO_ATTEMPT, type OptimisticEntry } from '@/shared/lib/optimistic/entry';
import {
  beginEntry,
  dismissEntry,
  interruptEntry,
  reconcileEntry,
  type SettleFailureInput,
  type SettleSuccessInput,
  settleFailureEntry,
  settleSuccessEntry,
} from '@/shared/lib/optimistic/transitions';

/** The call a failure is filed under. Tests that do not correlate two of them share one. */
const ATTEMPT = 1;

const NOW = 1_700_000_000_000;

function opened(): OptimisticEntry {
  return beginEntry(
    null,
    {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Typed' },
      sourceVersion: '2026-08-25T09:00:00.000Z',
    },
    1,
    NOW,
  );
}

/** A failure that left something behind, narrowed for the assertions that follow. */
function refused(
  entry: OptimisticEntry,
  input: SettleFailureInput,
  call = ATTEMPT,
  at = NOW,
): OptimisticEntry {
  const settled = settleFailureEntry(entry, input, call, at);

  if (settled === null) {
    throw new Error('the failure left nothing behind');
  }

  return settled;
}

/** A success that left something behind, narrowed for the assertions that follow. */
function succeeded(entry: OptimisticEntry, input: SettleSuccessInput): OptimisticEntry {
  const settled = settleSuccessEntry(entry, input, NOW);

  if (settled === null) {
    throw new Error('the success left nothing behind');
  }

  return settled;
}

describe('beginEntry', () => {
  it('opens an entry carrying the optimistic patch and its flight state', () => {
    const entry = opened();

    expect(entry.patch).toEqual({ title: 'Typed' });
    expect(entry.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(entry.pendingFields).toEqual({ title: PENDING_ACTION.UPDATE });
    expect(entry.sourceVersion).toBe('2026-08-25T09:00:00.000Z');
    expect(entry.latestCall).toBe(1);
    expect(entry.touchedAt).toBe(NOW);
  });

  it('merges a second write on a different field rather than replacing the first', () => {
    const entry = beginEntry(
      opened(),
      { action: PENDING_ACTION.UPDATE, optimisticData: { body: 'Body' } },
      2,
      NOW + 5,
    );

    expect(entry.patch).toEqual({ title: 'Typed', body: 'Body' });
    expect(entry.pendingFields).toEqual({
      title: PENDING_ACTION.UPDATE,
      body: PENDING_ACTION.UPDATE,
    });
    expect(entry.latestCall).toBe(2);
  });

  it('lets the later write win on the same field', () => {
    const entry = beginEntry(
      opened(),
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed again' } },
      2,
      NOW + 5,
    );

    expect(entry.patch).toEqual({ title: 'Typed again' });
  });

  it('marks the entry touched, so age is measured from the last write and not the first', () => {
    const entry = beginEntry(opened(), { action: PENDING_ACTION.UPDATE }, 2, NOW + 5);

    // Age is what ends a refused write nobody came back to. Measured from the
    // first write, a key busy for a week would expire the value typed into it a
    // second ago.
    expect(entry.touchedAt).toBe(NOW + 5);
    expect(entry.sourceVersion).toBe('2026-08-25T09:00:00.000Z');
  });

  it('clears the failure the last attempt on those fields left', () => {
    const failed = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);

    const retried = beginEntry(
      failed,
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } },
      2,
      NOW + 5,
    );

    // A reason describes the attempt that filed it, and a retry makes that
    // statement stale — left up, it is read as the answer to the write in flight.
    expect(retried.error).toBeNull();
    expect(retried.fieldErrors).toEqual({});
    expect(retried.pendingAction).toBe(PENDING_ACTION.UPDATE);
  });

  it('leaves a failure filed against a field this write does not name', () => {
    const failed = refused(
      opened(),
      { error: { code: ACTION_ERROR.CONFLICT }, fields: ['body'] },
      ATTEMPT,
      NOW,
    );

    const retried = beginEntry(
      failed,
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } },
      2,
      NOW + 5,
    );

    // `body` is still refused and nobody has asked again, so its reason stands —
    // and the record's copy stands with it, because that is the failure it names.
    expect(retried.fieldErrors.body).toEqual(failed.error);
    expect(retried.error).toEqual(failed.error);
  });

  it('takes the fields it was handed over the patch keys', () => {
    const entry = beginEntry(
      null,
      { action: PENDING_ACTION.DELETE, fields: ['title', 'body'] },
      1,
      NOW,
    );

    expect(entry.pendingFields).toEqual({
      title: PENDING_ACTION.DELETE,
      body: PENDING_ACTION.DELETE,
    });
  });
});

describe('settleSuccessEntry', () => {
  it("writes the server's response into the patch when no successData is given", () => {
    const entry = succeeded(opened(), { serverData: { title: 'Typed2' } });

    expect(entry.patch).toEqual({ title: 'Typed2' });
  });

  it('leaves a hand-written successData in place over the same field', () => {
    const entry = succeeded(opened(), {
      serverData: { title: 'Typed2' },
      successData: { title: 'By hand' },
    });

    expect(entry.patch).toEqual({ title: 'By hand' });
  });

  it('applies finallyData last', () => {
    const entry = succeeded(opened(), {
      serverData: { title: 'Typed2' },
      successData: { title: 'By hand' },
      finallyData: { title: 'Last' },
    });

    expect(entry.patch).toEqual({ title: 'Last' });
  });

  it('clears the flight state and every error', () => {
    const entry = succeeded(opened(), {});

    expect(entry.pendingAction).toBeNull();
    expect(entry.pendingFields).toEqual({});
    expect(entry.error).toBeNull();
  });

  it("adopts the server's version so the entry can be superseded later", () => {
    const entry = succeeded(opened(), { serverVersion: '2026-08-25T10:00:00.000Z' });

    expect(entry.sourceVersion).toBe('2026-08-25T10:00:00.000Z');
  });

  it('settles even when the response is not newer than the version it was built against', () => {
    const entry = succeeded(opened(), { serverVersion: '2026-08-20T09:00:00.000Z' });

    expect(entry.pendingAction).toBeNull();
    expect(entry.sourceVersion).toBe('2026-08-20T09:00:00.000Z');
  });
});

describe('settleFailureEntry', () => {
  it('leaves the optimistic value untouched and records the code when no failureData is given', () => {
    const entry = refused(opened(), { error: { code: ACTION_ERROR.UNEXPECTED } }, ATTEMPT, NOW);

    expect(entry.patch).toEqual({ title: 'Typed' });
    expect(entry.error).toEqual({ code: ACTION_ERROR.UNEXPECTED, fields: null, attempt: ATTEMPT });
  });

  it('restores the previous value when failureData carries it', () => {
    const entry = refused(
      opened(),
      { error: { code: ACTION_ERROR.UNEXPECTED }, failureData: { title: 'Server' } },
      ATTEMPT,
      NOW,
    );

    expect(entry.patch).toEqual({ title: 'Server' });
  });

  it('files per-field messages under the field they belong to', () => {
    const entry = refused(
      opened(),
      { error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['Too long'] } } },
      ATTEMPT,
      NOW,
    );

    expect(entry.fieldErrors.title).toEqual({
      code: ACTION_ERROR.INVALID_INPUT,
      fields: { title: ['Too long'] },
      attempt: ATTEMPT,
    });
  });

  it('clears the flight state', () => {
    const entry = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);

    expect(entry.pendingAction).toBeNull();
    expect(entry.pendingFields).toEqual({});
  });

  it('replaces what an earlier attempt recorded rather than stacking under it', () => {
    const once = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, 1, NOW);
    const twice = refused(once, { error: { code: ACTION_ERROR.NOT_FOUND } }, 2, NOW + 1);

    // This answer is the whole truth about the write; the previous reason under
    // it would either repeat it or contradict it.
    expect(twice.error?.code).toBe(ACTION_ERROR.NOT_FOUND);
    expect(twice.error?.attempt).toBe(2);
  });
});

describe('dismissEntry', () => {
  it('drops the whole entry when nothing is left to say', () => {
    const failed = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);

    expect(dismissEntry(failed)).toBeNull();
  });

  it('is a no-op on an entry that was already dismissed', () => {
    const failed = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);
    const dismissed = dismissEntry(failed);

    expect(dismissed).toBeNull();
    expect(dismissEntry(opened())).not.toBeNull();
  });

  it('keeps an entry whose write is still in flight', () => {
    const dismissed = dismissEntry(opened());

    expect(dismissed?.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(dismissed?.error).toBeNull();
  });

  it('clears the record-level copy of the failure it is named for', () => {
    const failed = refused(
      opened(),
      { error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['Too long'] } } },
      ATTEMPT,
      NOW,
    );

    const dismissed = dismissEntry(failed, 'title');

    // Every failure is filed twice — once per field it names, once on the record.
    // Leaving the record's copy makes the dismiss button do nothing visible.
    expect(dismissed).toBeNull();
  });

  it('leaves a failure that names no field, which is not the field\u2019s to dismiss', () => {
    const failed = refused(
      opened(),
      { error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['Too long'] } } },
      ATTEMPT,
      NOW,
    );
    // A second call, so the two failures do not share an attempt: that number is
    // the whole of what says which record-level copy belongs to which field.
    const alsoFormLevel = refused(
      failed,
      { error: { code: ACTION_ERROR.UNAUTHENTICATED } },
      ATTEMPT + 1,
      NOW + 1,
    );

    const dismissed = dismissEntry(alsoFormLevel, 'title');

    expect(dismissed?.fieldErrors.title).toBeUndefined();
    expect(dismissed?.error?.code).toBe(ACTION_ERROR.UNAUTHENTICATED);
  });

  it('takes the field\u2019s value with it, the way a whole dismissal does', () => {
    const failed = refused(
      opened(),
      { error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['Too long'] } } },
      ATTEMPT,
      NOW,
    );

    expect(dismissEntry(failed, 'title')?.patch.title).toBeUndefined();
  });

  it('clears one field only when it is named', () => {
    const failed = refused(
      opened(),
      {
        error: {
          code: ACTION_ERROR.INVALID_INPUT,
          fields: { title: ['Too long'], body: ['Too long'] },
        },
      },
      ATTEMPT,
      NOW,
    );

    const dismissed = dismissEntry(failed, 'title');

    expect(dismissed?.fieldErrors.title).toBeUndefined();
    expect(dismissed?.fieldErrors.body).toBeDefined();
  });
});

describe('interruptEntry', () => {
  it('turns a write still in flight into a failure nobody knows the end of', () => {
    const entry = interruptEntry(opened(), NOW);

    expect(entry.pendingAction).toBeNull();
    expect(entry.pendingFields).toEqual({});
    expect(entry.error).toEqual({
      code: OPTIMISTIC_ERROR.INTERRUPTED,
      fields: null,
      attempt: NO_ATTEMPT,
    });
  });

  it('keeps the value the User typed', () => {
    expect(interruptEntry(opened(), NOW).patch).toEqual({ title: 'Typed' });
  });

  it('leaves a settled entry alone', () => {
    const settled = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);

    expect(interruptEntry(settled, NOW + 1)).toBe(settled);
  });
});

describe('reconcileEntry', () => {
  it('drops a settled entry once the server render catches up', () => {
    const settled = succeeded(opened(), { serverVersion: '2026-08-25T10:00:00.000Z' });

    expect(reconcileEntry(settled, '2026-08-25T10:00:00.000Z')).toBeNull();
  });

  it('keeps a settled entry while the server render is still behind', () => {
    const settled = succeeded(opened(), { serverVersion: '2026-08-25T10:00:00.000Z' });

    expect(reconcileEntry(settled, '2026-08-25T09:30:00.000Z')).toBe(settled);
  });

  it('keeps a refused value, because the server render it caught up with is the old one', () => {
    const failed = refused(opened(), { error: { code: ACTION_ERROR.CONFLICT } }, ATTEMPT, NOW);

    // The write never landed, so there is nothing for the render to have caught up
    // with; dropping the patch would take the User's unsaved work and leave the
    // reason for it pointing at nothing. Only a dismissal throws an attempt away.
    expect(reconcileEntry(failed, '2026-08-25T10:00:00.000Z')).toBe(failed);
  });

  it('keeps an entry it has no version to date, because nothing can have caught up', () => {
    const undated: OptimisticEntry = {
      ...opened(),
      pendingAction: null,
      pendingFields: {},
      sourceVersion: null,
    };

    // `version` is optional on every hook. Superseding without one throws away a
    // value the server confirmed and falls back to whatever the render happens
    // to hold.
    expect(reconcileEntry(undated, null)).toBe(undated);
    expect(reconcileEntry(undated, '2026-08-25T10:00:00.000Z')).toBe(undated);
  });

  it('compares the instant rather than the text of a version', () => {
    const entry: OptimisticEntry = { ...opened(), pendingAction: null, pendingFields: {} };

    // The same moment, written two ways. A string compare calls the second one
    // older and pins the overlay on screen with nothing left to retire it.
    expect(reconcileEntry(entry, '2026-08-25T04:00:00.000-05:00')).toBeNull();
  });

  it('never supersedes a write that is still in flight', () => {
    const entry = opened();

    expect(reconcileEntry(entry, '2026-08-25T10:00:00.000Z')).toBe(entry);
  });
});

describe('the entry that has served its purpose', () => {
  it('is deleted by a success that leaves nothing behind', () => {
    const opened = beginEntry(null, { action: PENDING_ACTION.ADD, fields: [] }, 1, NOW);

    // Written back instead, the key sits in the document forever: nothing calls
    // reconcile on a list, and only the next page load would drop it.
    expect(settleSuccessEntry(opened, {}, NOW)).toBeNull();
  });

  it('survives a success that left a value on screen', () => {
    expect(settleSuccessEntry(opened(), { serverData: { title: 'Saved' } }, NOW)).not.toBeNull();
  });
});
