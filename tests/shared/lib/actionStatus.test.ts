import { describe, expect, it } from 'vitest';

import { ACTION_STATUS, type ActionStatus } from '@/constants/action';
import { isFailure, isIdle, isPending, isSuccess } from '@/shared/lib/actionStatus';

const PREDICATES: Record<ActionStatus, (status: ActionStatus) => boolean> = {
  [ACTION_STATUS.IDLE]: isIdle,
  [ACTION_STATUS.PENDING]: isPending,
  [ACTION_STATUS.SUCCESS]: isSuccess,
  [ACTION_STATUS.FAILURE]: isFailure,
};

describe('the status predicates', () => {
  it('answer true for their own status and false for every other', () => {
    for (const [own, predicate] of Object.entries(PREDICATES)) {
      for (const status of Object.values(ACTION_STATUS)) {
        expect(predicate(status)).toBe(status === own);
      }
    }
  });

  it('cover every status, so a new one cannot be added without a predicate', () => {
    expect(Object.keys(PREDICATES).sort()).toEqual(Object.values(ACTION_STATUS).sort());
  });
});
