import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_PENDING_DELAY_MS, PENDING_ACTION } from '@/constants/optimistic';
import { OptimisticRow } from '@/shared/components/OptimisticRow';
import { clientFailure } from '@/shared/lib/optimistic/entry';

import { announced, messages, renderWithProviders } from '../../setup/render';

const copy = messages.optimistic;
const errorCopy = messages.actionError;

/** The row's content, which is what dims — the message beside it never does. */
function content(): HTMLElement {
  return screen.getByRole('listitem').firstElementChild as HTMLElement;
}
const ROW = 'Buy milk';
const FAILURE = clientFailure(ACTION_ERROR.UNEXPECTED);

function renderRow(props: Partial<Parameters<typeof OptimisticRow>[0]> = {}) {
  return renderWithProviders(
    <ul>
      <OptimisticRow error={null} pendingAction={null} {...props}>
        <span>{ROW}</span>
      </OptimisticRow>
    </ul>,
  );
}

describe('OptimisticRow', () => {
  it('renders a settled row plainly', () => {
    renderRow();

    const row = screen.getByRole('listitem');

    expect(row).toHaveTextContent(ROW);
    expect(content()).not.toHaveClass('opacity-70');
    expect(content()).not.toHaveClass('line-through');
    expect(row).not.toHaveAttribute('aria-busy', 'true');
  });

  it('renders the failure under the row without taking the row away', () => {
    renderRow({ error: FAILURE });

    expect(screen.getByRole('listitem')).toHaveTextContent(ROW);
    expect(announced()).toHaveTextContent(errorCopy.unexpected);
  });

  it('keeps a failed update at full opacity — the server has the row', () => {
    renderRow({ error: FAILURE });

    expect(content()).not.toHaveClass('opacity-70');
  });

  it('leaves a failed insert dim — the server has nothing', () => {
    renderRow({ error: FAILURE, isDraft: true });

    expect(content()).toHaveClass('opacity-70');
  });

  it('hands the dismissal back to whatever owns the row', () => {
    const onDismiss = vi.fn();

    renderRow({ error: FAILURE, onDismiss });
    fireEvent.click(screen.getByRole('button', { name: copy.dismiss }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the row when the message is thrown away', async () => {
    renderRow({ pendingAction: null, error: FAILURE, onDismiss: vi.fn() });

    const dismiss = screen.getByRole('button');

    dismiss.focus();
    fireEvent.click(dismiss);

    // Without this the browser drops focus to the body and a keyboard User is
    // returned to the top of the document.
    await waitFor(() => expect(screen.getByRole('listitem')).toHaveFocus());
  });

  it('gives the dismiss control the message as its description', () => {
    renderRow({ pendingAction: null, error: FAILURE, onDismiss: vi.fn() });

    const describedBy = screen.getByRole('button').getAttribute('aria-describedby');

    // Every row offers a button called "Dismiss"; the description is what tells
    // them apart.
    expect(describedBy).not.toBeNull();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(errorCopy.unexpected);
  });

  describe('the 200 ms threshold', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function advance(ms: number) {
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    }

    it('shows nothing of a write that is only 100 ms old', () => {
      renderRow({ pendingAction: PENDING_ACTION.UPDATE });

      advance(100);

      expect(content()).not.toHaveClass('opacity-70');
      expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-busy', 'true');
    });

    it('dims a write still running past the threshold', () => {
      renderRow({ pendingAction: PENDING_ACTION.UPDATE });

      advance(OPTIMISTIC_PENDING_DELAY_MS);

      expect(content()).toHaveClass('opacity-70');
      expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
    });

    it('strikes a row through while its removal is in flight, in place', () => {
      renderRow({ pendingAction: PENDING_ACTION.DELETE });

      advance(OPTIMISTIC_PENDING_DELAY_MS);

      const row = screen.getByRole('listitem');

      expect(content()).toHaveClass('line-through');
      expect(row).toHaveTextContent(ROW);
    });

    it('never disables anything it renders', () => {
      renderRow({ pendingAction: PENDING_ACTION.UPDATE, error: FAILURE, onDismiss: vi.fn() });

      advance(OPTIMISTIC_PENDING_DELAY_MS);

      expect(screen.getByRole('listitem').querySelector('[disabled]')).toBeNull();
      expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-disabled');
    });

    it('leaves no timer behind when the row unmounts mid-flight', () => {
      renderRow({ pendingAction: PENDING_ACTION.UPDATE }).unmount();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('never dims the message, whatever it does to the row', () => {
      renderRow({ pendingAction: PENDING_ACTION.UPDATE, error: FAILURE, isDraft: true });

      advance(OPTIMISTIC_PENDING_DELAY_MS);

      // Dimmed with the row it measured 3.04:1 against the card in `standard`,
      // under the 4.5:1 held here (WCAG 2.2 AA, 1.4.3).
      expect(content()).toHaveClass('opacity-70');
      expect(content()).not.toContainElement(announced());
    });
  });
});
