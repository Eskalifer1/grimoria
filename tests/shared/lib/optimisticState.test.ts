import { describe, expect, it } from 'vitest';

import { ACTION_ERROR, ACTION_STATUS, FAILURE_BEHAVIOR } from '@/constants/action';
import { actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { idleOptimistic, settleOptimistic, startOptimistic } from '@/shared/lib/optimisticState';

describe('startOptimistic', () => {
  it('shows the optimistic value while the action is in flight', () => {
    expect(startOptimistic(idleOptimistic('Old name'), 'New name')).toEqual({
      value: 'New name',
      status: ACTION_STATUS.PENDING,
      error: null,
    });
  });

  it('clears the error left by an earlier failure', () => {
    const failed = settleOptimistic({
      previous: 'Old name',
      optimistic: 'New name',
      result: actionFailure(ACTION_ERROR.CONFLICT),
      failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
    });

    expect(startOptimistic(failed, 'New name').error).toBeNull();
  });
});

describe('settleOptimistic', () => {
  it('keeps the optimistic value when the action succeeds', () => {
    expect(
      settleOptimistic({
        previous: 'Old name',
        optimistic: 'New name',
        result: actionSuccess(null),
        failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
      }),
    ).toEqual({ value: 'New name', status: ACTION_STATUS.SUCCESS, error: null });
  });

  it('succeeds onto the confirmed value when the caller supplies one', () => {
    expect(
      settleOptimistic({
        previous: 'Old name',
        optimistic: 'New name',
        result: actionSuccess(null),
        failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
        successValue: { value: 'New name (server)' },
      }).value,
    ).toBe('New name (server)');
  });

  it('succeeds onto a confirmed null rather than reading it as no value at all', () => {
    expect(
      settleOptimistic<string | null>({
        previous: 'old.png',
        optimistic: 'new.png',
        result: actionSuccess(null),
        failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
        successValue: { value: null },
      }).value,
    ).toBeNull();
  });

  it('restores the previous value and carries the failure when an edit fails', () => {
    expect(
      settleOptimistic({
        previous: 'Old name',
        optimistic: 'New name',
        result: actionFailure(ACTION_ERROR.CONFLICT),
        failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
      }),
    ).toEqual({
      value: 'Old name',
      status: ACTION_STATUS.FAILURE,
      error: { code: ACTION_ERROR.CONFLICT, fields: null },
    });
  });

  it('keeps what the User typed and marks it failed when a create fails', () => {
    expect(
      settleOptimistic({
        previous: '',
        optimistic: 'New note',
        result: actionFailure(ACTION_ERROR.UNAUTHENTICATED),
        failureBehavior: FAILURE_BEHAVIOR.KEEP,
      }).value,
    ).toBe('New note');
  });

  it('carries the per-field messages a validation failure reports', () => {
    const fields = { name: ['Too short'] };

    expect(
      settleOptimistic({
        previous: 'Old name',
        optimistic: '',
        result: actionFailure(ACTION_ERROR.INVALID_INPUT, fields),
        failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
      }).error,
    ).toEqual({ code: ACTION_ERROR.INVALID_INPUT, fields });
  });
});
