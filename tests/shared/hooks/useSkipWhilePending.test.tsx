import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSkipWhilePending } from '@/shared/hooks/useSkipWhilePending';

/** A call that stays out until it is told to answer. */
function pending() {
  let settle = (): void => {};
  const run = vi.fn().mockReturnValue(
    new Promise<void>((resolve) => {
      settle = () => resolve();
    }),
  );

  return { run, settle: () => settle() };
}

describe('useSkipWhilePending', () => {
  it('drops a repeat made while the first call is still out', () => {
    const { run } = pending();
    const { result } = renderHook(() => useSkipWhilePending(run));

    expect(result.current('a')).toBe(true);
    // Inside one tick, so no render has happened between the two: a flag read
    // off the last render would not have heard about the first call yet.
    expect(result.current('b')).toBe(false);
    expect(run).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('lets the next call through once the first has answered', async () => {
    const { run, settle } = pending();
    const { result } = renderHook(() => useSkipWhilePending(run));

    result.current();

    await act(async () => {
      settle();
    });

    expect(result.current()).toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('frees the next call after one that was refused', async () => {
    const run = vi.fn().mockRejectedValue(new Error('the network went'));
    const { result } = renderHook(() => useSkipWhilePending(run));

    await act(async () => {
      result.current();
    });

    // A rejection ends the call as surely as an answer does; held open, the
    // caller is locked out for the life of the component.
    expect(result.current()).toBe(true);
  });

  it('gives the lock back when the call throws before it returns', () => {
    const run = vi.fn().mockImplementation(() => {
      throw new Error('thrown, not rejected');
    });
    const { result } = renderHook(() => useSkipWhilePending(run));

    expect(() => result.current()).toThrow();
    // Held, the caller is locked out for the life of the component.
    expect(result.current).toThrow();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('lets every call through where the repeat is legitimate', () => {
    const { run } = pending();
    const { result } = renderHook(() => useSkipWhilePending(run, false));

    expect(result.current()).toBe(true);
    expect(result.current()).toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
