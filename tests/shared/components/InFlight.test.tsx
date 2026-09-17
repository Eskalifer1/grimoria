import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OPTIMISTIC_PENDING_DELAY_MS, PENDING_ACTION } from '@/constants/optimistic';
import { InFlight } from '@/shared/components/InFlight';

function passPendingDelay() {
  act(() => {
    vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InFlight', () => {
  it('draws a settled value plainly, as inline text', () => {
    render(<InFlight pendingAction={null}>Value</InFlight>);

    const value = screen.getByText('Value');

    expect(value.tagName).toBe('SPAN');
    expect(value).not.toHaveAttribute('aria-busy');
    expect(value).not.toHaveClass('opacity-70');
  });

  it('dims and says busy once a write has been out past the delay, not before', () => {
    render(<InFlight pendingAction={PENDING_ACTION.UPDATE}>Value</InFlight>);

    expect(screen.getByText('Value')).not.toHaveAttribute('aria-busy');

    passPendingDelay();

    expect(screen.getByText('Value')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Value')).toHaveClass('opacity-70');
    expect(screen.getByText('Value')).not.toHaveClass('line-through');
  });

  it('strikes a delete through', () => {
    render(<InFlight pendingAction={PENDING_ACTION.DELETE}>Value</InFlight>);

    passPendingDelay();

    expect(screen.getByText('Value')).toHaveClass('line-through');
  });

  it('stays dim for an unconfirmed draft with nothing in flight, and as a block when asked', () => {
    render(
      <InFlight as="div" isUnconfirmed pendingAction={null}>
        Value
      </InFlight>,
    );

    expect(screen.getByText('Value').tagName).toBe('DIV');
    expect(screen.getByText('Value')).toHaveClass('opacity-70');
    expect(screen.getByText('Value')).not.toHaveAttribute('aria-busy');
  });
});
