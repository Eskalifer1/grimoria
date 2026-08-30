import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { OPTIMISTIC_PENDING_DELAY_MS } from '@/constants/optimistic';
import { BlockingView } from '@/shared/components/BlockingView';
import { clientFailure } from '@/shared/lib/optimistic/entry';

import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

const copy = messages.optimistic;
const errorCopy = messages.actionError;
const SURFACE = 'The surface';

describe('BlockingView', () => {
  it('renders the surface when nothing is blocking it', () => {
    renderWithProviders(
      <BlockingView status={ACTION_STATUS.IDLE}>
        <p>{SURFACE}</p>
      </BlockingView>,
    );

    expect(screen.getByText(SURFACE)).toBeInTheDocument();
  });

  it('renders the surface after a read landed', () => {
    renderWithProviders(
      <BlockingView status={ACTION_STATUS.SUCCESS}>
        <p>{SURFACE}</p>
      </BlockingView>,
    );

    expect(screen.getByText(SURFACE)).toBeInTheDocument();
  });

  it('replaces the surface with the failure and announces it', () => {
    renderWithProviders(
      <BlockingView error={clientFailure(ACTION_ERROR.FORBIDDEN)} status={ACTION_STATUS.FAILURE}>
        <p>{SURFACE}</p>
      </BlockingView>,
    );

    // Hidden, not unmounted: the two share a grid cell so taking over costs no
    // layout shift, and the surface keeps its space while `inert` takes it out
    // of the tab order and the accessibility tree.
    expect(screen.getByText(SURFACE).parentElement).toHaveAttribute('inert');
    expect(announced()).toHaveTextContent(errorCopy.forbidden);
  });

  it('words an unexplained failure rather than blocking on nothing', () => {
    renderWithProviders(
      <BlockingView status={ACTION_STATUS.FAILURE}>
        <p>{SURFACE}</p>
      </BlockingView>,
    );

    expect(announced()).toHaveTextContent(errorCopy.unexpected);
  });

  it('renders the way out beneath the failure', () => {
    const RETRY = 'Try again';

    renderWithProviders(
      <BlockingView
        action={<button type="button">{RETRY}</button>}
        error={clientFailure(ACTION_ERROR.UNEXPECTED)}
        status={ACTION_STATUS.FAILURE}
      >
        <p>{SURFACE}</p>
      </BlockingView>,
    );

    expect(screen.getByRole('button', { name: RETRY })).toBeInTheDocument();
  });

  describe('the 200 ms threshold', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('leaves the surface alone for a read that answers in 100 ms', () => {
      renderWithProviders(
        <BlockingView status={ACTION_STATUS.PENDING}>
          <p>{SURFACE}</p>
        </BlockingView>,
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText(SURFACE)).toBeInTheDocument();
      expectNothingAnnounced();
    });

    it('does not hand the surface back for the length of a retry', () => {
      const { rerender } = renderWithProviders(
        <BlockingView error={clientFailure(ACTION_ERROR.UNEXPECTED)} status={ACTION_STATUS.FAILURE}>
          <p>{SURFACE}</p>
        </BlockingView>,
      );

      rerender(
        <BlockingView status={ACTION_STATUS.PENDING}>
          <p>{SURFACE}</p>
        </BlockingView>,
      );

      // The threshold is there so a fast answer never replaces a working
      // surface. This one is already replaced, and handing it back for 200 ms
      // flashes the value the retry is trying to correct.
      expect(screen.getByText(SURFACE).parentElement).toHaveAttribute('inert');
      expect(announced()).toHaveTextContent(copy.pending);
    });

    it('blocks a read still running past the threshold', () => {
      renderWithProviders(
        <BlockingView status={ACTION_STATUS.PENDING}>
          <p>{SURFACE}</p>
        </BlockingView>,
      );

      act(() => {
        vi.advanceTimersByTime(OPTIMISTIC_PENDING_DELAY_MS);
      });

      expect(screen.getByText(SURFACE).parentElement).toHaveAttribute('inert');
      expect(announced()).toHaveTextContent(copy.pending);
      // The block itself still says it is working; the region says it out loud.
      const busy = screen.getAllByText(copy.pending).map((node) => node.closest('[aria-busy]'));

      expect(busy.filter((node) => !!node)).toHaveLength(1);
    });
  });
});
