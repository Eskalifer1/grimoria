import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsOffline } from '@/shared/hooks/useIsOffline';

function setOnline(isOnline: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(isOnline);
  act(() => {
    window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
  });
}

describe('useIsOffline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports nothing while the browser says it is online', () => {
    const { result } = renderHook(() => useIsOffline());

    expect(result.current).toBe(false);
  });

  it('reports the loss as soon as the browser announces it', () => {
    const { result } = renderHook(() => useIsOffline());

    setOnline(false);

    expect(result.current).toBe(true);
  });

  it('clears itself when the connection comes back', () => {
    const { result } = renderHook(() => useIsOffline());

    setOnline(false);
    setOnline(true);

    expect(result.current).toBe(false);
  });

  it('stops listening once the surface unmounts', () => {
    const { result, unmount } = renderHook(() => useIsOffline());

    unmount();
    setOnline(false);

    expect(result.current).toBe(false);
  });
});
