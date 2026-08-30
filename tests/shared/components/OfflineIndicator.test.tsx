import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OfflineIndicator } from '@/shared/components/OfflineIndicator';

import { messages, renderWithProviders } from '../../setup/render';

const copy = messages.optimistic;

function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

describe('OfflineIndicator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps its region mounted and silent while the connection holds', () => {
    renderWithProviders(<OfflineIndicator />);

    // Mounted, not absent: a region built at the moment it has something to say
    // is not a content change, and most screen readers never speak it.
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('says the connection is gone, politely', () => {
    renderWithProviders(<OfflineIndicator />);

    goOffline();

    expect(screen.getByRole('status')).toHaveTextContent(copy.offline);
  });

  it('disables nothing — the write still goes out and still fails', () => {
    renderWithProviders(<OfflineIndicator />);

    goOffline();

    expect(screen.getByRole('status').querySelector('[disabled]')).toBeNull();
  });

  it('goes away when the connection returns', () => {
    renderWithProviders(<OfflineIndicator />);

    goOffline();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
