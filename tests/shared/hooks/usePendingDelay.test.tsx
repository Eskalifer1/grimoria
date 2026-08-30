import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OPTIMISTIC_PENDING_DELAY_MS } from '@/constants/optimistic';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';

describe('usePendingDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays quiet while the write is still inside the threshold', () => {
    const { result } = renderHook(() => usePendingDelay(true));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS - 1);
    });

    expect(result.current).toBe(false);
  });

  it('reports the write once it outlasts the threshold', () => {
    const { result } = renderHook(() => usePendingDelay(true));

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
    });

    expect(result.current).toBe(true);
  });

  it('never reports a write that settled inside the threshold', () => {
    const { rerender, result } = renderHook(({ isPending }) => usePendingDelay(isPending), {
      initialProps: { isPending: true },
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ isPending: false });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(false);
  });

  it('drops the report the moment the write settles', () => {
    const { rerender, result } = renderHook(({ isPending }) => usePendingDelay(isPending), {
      initialProps: { isPending: true },
    });

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
    });
    rerender({ isPending: false });

    expect(result.current).toBe(false);
  });

  it('starts the threshold again for a second write', () => {
    const { rerender, result } = renderHook(({ isPending }) => usePendingDelay(isPending), {
      initialProps: { isPending: true },
    });

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
    });
    rerender({ isPending: false });
    rerender({ isPending: true });

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
    });

    expect(result.current).toBe(true);
  });

  it('leaves no timer behind when the surface unmounts mid-flight', () => {
    const { unmount } = renderHook(() => usePendingDelay(true));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
