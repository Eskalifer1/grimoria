import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ACTION_STATUS, type ActionStatus } from '@/constants/action';
import { useLastSettledStatus } from '@/shared/hooks/useLastSettledStatus';

describe('useLastSettledStatus', () => {
  it('answers a settled status as itself', () => {
    const { result } = renderHook(() => useLastSettledStatus(ACTION_STATUS.SUCCESS));

    expect(result.current).toBe(ACTION_STATUS.SUCCESS);
  });

  it('holds the failure a retry is retrying, for as long as the retry is out', () => {
    const { result, rerender } = renderHook(({ status }) => useLastSettledStatus(status), {
      initialProps: { status: ACTION_STATUS.FAILURE as ActionStatus },
    });

    rerender({ status: ACTION_STATUS.PENDING });
    // The render after, and the one after that: the previous render's status is
    // "pending" from here on, and whatever it is retrying would be forgotten.
    rerender({ status: ACTION_STATUS.PENDING });

    expect(result.current).toBe(ACTION_STATUS.FAILURE);
  });

  it('moves on once the retry lands', () => {
    const { result, rerender } = renderHook(({ status }) => useLastSettledStatus(status), {
      initialProps: { status: ACTION_STATUS.FAILURE as ActionStatus },
    });

    rerender({ status: ACTION_STATUS.PENDING });
    rerender({ status: ACTION_STATUS.SUCCESS });

    expect(result.current).toBe(ACTION_STATUS.SUCCESS);
  });

  it('does not call a first attempt a retry', () => {
    const { result, rerender } = renderHook(({ status }) => useLastSettledStatus(status), {
      initialProps: { status: ACTION_STATUS.IDLE as ActionStatus },
    });

    rerender({ status: ACTION_STATUS.PENDING });

    expect(result.current).toBe(ACTION_STATUS.IDLE);
  });
});
