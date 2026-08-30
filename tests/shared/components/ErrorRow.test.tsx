import { useState } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_ERROR } from '@/constants/optimistic';
import { ErrorRow } from '@/shared/components/ErrorRow';
import { clientFailure } from '@/shared/lib/optimistic/entry';

import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

const copy = messages.optimistic;
const errorCopy = messages.actionError;

const failure = clientFailure;

describe('ErrorRow', () => {
  it('keeps its region mounted and silent when nothing failed', () => {
    renderWithProviders(<ErrorRow errors={[]} />);

    // Mounted, not absent: a region created together with its text is not a
    // content change, and most screen readers never speak it.
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expectNothingAnnounced();
  });

  it('words a failure from the shared catalog and announces it', () => {
    renderWithProviders(<ErrorRow errors={[failure(ACTION_ERROR.NOT_FOUND)]} />);

    expect(announced()).toHaveTextContent(errorCopy.notFound);
  });

  it('collapses two attempts that failed the same way into one message', () => {
    renderWithProviders(
      <ErrorRow errors={[failure(ACTION_ERROR.UNEXPECTED), failure(ACTION_ERROR.UNEXPECTED)]} />,
    );

    expect(screen.getAllByText(errorCopy.unexpected)).toHaveLength(1);
  });

  it('keeps two failures that are not the same', () => {
    renderWithProviders(
      <ErrorRow
        errors={[failure(ACTION_ERROR.UNEXPECTED), failure(OPTIMISTIC_ERROR.INTERRUPTED)]}
      />,
    );

    expect(screen.getByText(errorCopy.unexpected)).toBeInTheDocument();
    expect(screen.getByText(errorCopy.interrupted)).toBeInTheDocument();
  });

  it('offers no dismiss control when there is nothing to dismiss with', () => {
    renderWithProviders(<ErrorRow errors={[failure(ACTION_ERROR.UNEXPECTED)]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hands the dismissal back to whatever owns the entry', () => {
    const onDismiss = vi.fn();

    renderWithProviders(
      <ErrorRow errors={[failure(ACTION_ERROR.UNEXPECTED)]} onDismiss={onDismiss} />,
    );
    fireEvent.click(screen.getByRole('button', { name: copy.dismiss }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('draws the dismissal as a cross and still names it in words', () => {
    renderWithProviders(
      <ErrorRow errors={[failure(ACTION_ERROR.UNEXPECTED)]} onDismiss={vi.fn()} />,
    );

    const dismiss = screen.getByRole('button', { name: copy.dismiss });

    // The icon is decoration. Named by it instead, the button would be announced
    // as "graphic" or by whatever file name the bundler happened to give it.
    expect(dismiss.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('never disables its own dismiss control', () => {
    renderWithProviders(
      <ErrorRow errors={[failure(ACTION_ERROR.UNEXPECTED)]} onDismiss={vi.fn()} />,
    );

    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('falls back to what outlived the dismissal when the message takes its row with it', async () => {
    function Vanishing() {
      const [gone, setGone] = useState(false);

      return (
        <section>
          <h2>Notes</h2>
          {gone ? null : (
            <p>
              <ErrorRow
                errors={[failure(ACTION_ERROR.UNEXPECTED)]}
                onDismiss={() => setGone(true)}
              />
            </p>
          )}
        </section>
      );
    }

    renderWithProviders(<Vanishing />);

    const dismiss = screen.getByRole('button');

    dismiss.focus();
    fireEvent.click(dismiss);

    // A failed create is thrown away row and all, so there is no row left to
    // return to — and the body is not an answer.
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    // The nearest thing still standing, given a tabindex so it can hold focus.
    expect(document.activeElement?.tagName).toBe('SECTION');
  });
});
