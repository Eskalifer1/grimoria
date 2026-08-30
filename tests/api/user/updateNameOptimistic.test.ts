import { describe, expect, it } from 'vitest';

import { updateNameOptimistic } from '@/api/user/updateName/optimistic';
import { userKey } from '@/api/user/userOptimisticKeys';
import { PENDING_ACTION } from '@/constants/optimistic';

const ID = '00000000-0000-4000-8000-000000000001';

describe('updateNameOptimistic', () => {
  it('addresses the User the input names, through the key module', () => {
    expect(updateNameOptimistic.key({ id: ID, name: 'Merlin' })).toBe(userKey(ID));
  });

  it('is an update, so a failure leaves the row at full opacity', () => {
    expect(updateNameOptimistic.pending).toBe(PENDING_ACTION.UPDATE);
  });

  it('patches the name alone, and dates the entry by the answer', () => {
    const answer = { name: 'Morgan', updatedAt: '2026-08-25T11:00:00.000Z' };

    expect(updateNameOptimistic.value?.(answer)).toEqual({ name: 'Morgan' });
    expect(updateNameOptimistic.version?.(answer)).toBe(answer.updatedAt);
  });
});
