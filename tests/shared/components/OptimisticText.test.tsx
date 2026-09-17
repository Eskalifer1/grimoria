import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OPTIMISTIC_PENDING_DELAY_MS,
  PENDING_ACTION,
  type PendingAction,
} from '@/constants/optimistic';
import { OptimisticText } from '@/shared/components/OptimisticText';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';

const NOTE_ID = '55555555-5555-4555-8555-555555555555';

function beginWrite(action: PendingAction, title = 'Typed') {
  act(() => {
    optimisticStore.begin(noteKey(NOTE_ID), { action, optimisticData: { title } });
  });
}

function passPendingDelay() {
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
});

describe('OptimisticText', () => {
  it('is the server text, then the store text, with no failure surface of its own', () => {
    render(<OptimisticText storeKey={noteKey(NOTE_ID)} field="title" value="Server" />);

    expect(screen.getByText('Server')).toBeInTheDocument();

    beginWrite(PENDING_ACTION.UPDATE);

    expect(screen.getByText('Typed')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('dims once a write has been out past the pending delay, and not before', () => {
    render(<OptimisticText storeKey={noteKey(NOTE_ID)} field="title" value="Server" />);

    beginWrite(PENDING_ACTION.UPDATE);
    expect(screen.getByText('Typed')).not.toHaveAttribute('aria-busy');

    passPendingDelay();
    expect(screen.getByText('Typed')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Typed')).toHaveClass('opacity-70');
    expect(screen.getByText('Typed')).not.toHaveClass('line-through');
  });

  it('strikes the text through while a delete is out', () => {
    render(<OptimisticText storeKey={noteKey(NOTE_ID)} field="title" value="Server" />);

    beginWrite(PENDING_ACTION.DELETE, 'Server');
    passPendingDelay();

    expect(screen.getByText('Server')).toHaveClass('line-through');
  });
});
