import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OPTIMISTIC_PENDING_DELAY_MS, PENDING_ACTION } from '@/constants/optimistic';
import { SyncProgressBar } from '@/shared/components/SyncProgressBar';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';

const NOTE_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_ID = '55555555-5555-4555-8555-555555555555';
const SWEEP = 'animate-sync-sweep';
const TRAIL = 'animate-sync-trail';

function track(): HTMLElement {
  const found = document.querySelector('[aria-hidden="true"]');

  expect(found).not.toBeNull();

  return found as HTMLElement;
}

function isSweeping(): boolean {
  return !!track().querySelector(`.${SWEEP}`);
}

/** Both passes, which is what keeps the track from going empty mid-cycle. */
function passes(): number {
  return track().querySelectorAll(`.${SWEEP}, .${TRAIL}`).length;
}

function begin(id: string): number {
  let call = 0;

  act(() => {
    call = optimisticStore.begin(noteKey(id), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Typed' },
    });
  });

  return call;
}

/** Past the threshold, which is where every pending state in this app starts drawing. */
function passThreshold() {
  act(() => {
    vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  optimisticStore.clearAll();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('SyncProgressBar', () => {
  it('draws nothing while nothing is in flight', () => {
    render(<SyncProgressBar />);

    expect(isSweeping()).toBe(false);
  });

  it('waits out the threshold rather than flashing for a write that answers at once', () => {
    render(<SyncProgressBar />);

    const call = begin(NOTE_ID);

    expect(isSweeping()).toBe(false);

    act(() => {
      optimisticStore.settleSuccess(noteKey(NOTE_ID), call, { fields: ['title'] });
    });
    passThreshold();

    expect(isSweeping()).toBe(false);
  });

  it('sweeps once a write outlasts the threshold', () => {
    render(<SyncProgressBar />);
    begin(NOTE_ID);
    passThreshold();

    expect(isSweeping()).toBe(true);
  });

  it('stays up while any key is still writing, not only the one that started it', () => {
    render(<SyncProgressBar />);

    const first = begin(NOTE_ID);

    begin(OTHER_ID);
    passThreshold();

    act(() => {
      optimisticStore.settleSuccess(noteKey(NOTE_ID), first, { fields: ['title'] });
    });

    // The bar speaks for the whole store: one key answering says nothing about
    // whether the app has stopped talking to the server.
    expect(isSweeping()).toBe(true);
  });

  it('goes down once the last write is settled', () => {
    render(<SyncProgressBar />);

    const call = begin(NOTE_ID);

    passThreshold();

    act(() => {
      optimisticStore.settleSuccess(noteKey(NOTE_ID), call, { fields: ['title'] });
    });

    expect(isSweeping()).toBe(false);
  });

  it('stays up for a write that failed only until it is settled, never after', () => {
    render(<SyncProgressBar />);

    const call = begin(NOTE_ID);

    passThreshold();

    act(() => {
      optimisticStore.settleFailure(noteKey(NOTE_ID), call, {
        error: { code: 'unexpected' },
        fields: ['title'],
      });
    });

    // A failure is a settled write. The reason is drawn where the value is, and
    // a bar left sweeping over it would say the app is still trying.
    expect(isSweeping()).toBe(false);
  });

  it('draws both passes, so the loop has no frame with an empty track', () => {
    render(<SyncProgressBar />);
    begin(NOTE_ID);
    passThreshold();

    expect(passes()).toBe(2);
  });

  it('keeps the track out of the accessibility tree, which the surfaces own', () => {
    render(<SyncProgressBar />);
    begin(NOTE_ID);
    passThreshold();

    // Every surface already announces its own flight; a second voice for the
    // same thing says it twice.
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(track()).toHaveAttribute('aria-hidden', 'true');
  });

  it('holds its height whether or not it has anything in it', () => {
    render(<SyncProgressBar />);

    // Mounted only while a write is out, the bar would shift what sits under it
    // twice per save.
    expect(track()).toHaveClass('h-0.5');
    expect(passes()).toBe(0);
  });
});
