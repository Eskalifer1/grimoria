import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_STATUS } from '@/constants/action';
import { OPTIMISTIC_PENDING_DELAY_MS } from '@/constants/optimistic';
import { StatusDot } from '@/shared/components/StatusDot';

import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

const copy = messages.optimistic;

describe('StatusDot', () => {
  it('renders the idle marker when no write has happened', () => {
    const { container } = renderWithProviders(<StatusDot status={ACTION_STATUS.IDLE} />);

    expect(container.querySelector('.bg-status-idle')).not.toBeNull();
    expectNothingAnnounced();
  });

  it('renders the settled marker after a write landed', () => {
    const { container } = renderWithProviders(<StatusDot status={ACTION_STATUS.SUCCESS} />);

    expect(container.querySelector('.bg-status-done')).not.toBeNull();
  });

  it('says nothing to a screen reader about a success', () => {
    renderWithProviders(<StatusDot status={ACTION_STATUS.SUCCESS} />);

    expectNothingAnnounced();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces a failure and marks it', () => {
    const { container } = renderWithProviders(<StatusDot status={ACTION_STATUS.FAILURE} />);

    expect(announced()).toHaveTextContent(copy.problem);
    expect(container.querySelector('.bg-status-failed')).not.toBeNull();
  });

  it('merges a caller class onto the root', () => {
    const { container } = renderWithProviders(
      <StatusDot className="ml-2" status={ACTION_STATUS.IDLE} />,
    );

    expect(container.firstElementChild).toHaveClass('ml-2');
  });

  describe('the 200 ms threshold', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows nothing of a write that is only 100 ms old', () => {
      const { container } = renderWithProviders(<StatusDot status={ACTION_STATUS.PENDING} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(container.querySelector('.bg-status-live')).toBeNull();
      expect(container.firstElementChild).not.toHaveAttribute('aria-busy', 'true');
    });

    it('shows a write still running past the threshold', () => {
      const { container } = renderWithProviders(<StatusDot status={ACTION_STATUS.PENDING} />);

      act(() => {
        vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
      });

      expect(container.querySelector('.bg-status-live')).not.toBeNull();
      expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    });
  });
});
