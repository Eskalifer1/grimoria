import { useRef, useState } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useReturnFocus } from '@/shared/hooks/useReturnFocus';

const DISMISS = 'Dismiss';
const INPUT = 'name';
const NUMBER = 'count';
const VALUE = 'Gandalf';

/** A row whose button removes the thing it sits in — which is what takes focus with it. */
function Row({ removesTheRow }: { removesTheRow: boolean }) {
  const [isShown, setIsShown] = useState(true);
  const removing = useRef<HTMLSpanElement>(null);
  const intended = useRef<HTMLInputElement>(null);
  const returnFocus = useReturnFocus(removing, intended);

  return (
    <section>
      <input aria-label={INPUT} defaultValue={VALUE} ref={intended} type="text" />
      {isShown ? (
        <span ref={removing}>
          <button onClick={() => returnFocus(() => setIsShown(false))} type="button">
            {DISMISS}
          </button>
        </span>
      ) : null}
      {removesTheRow ? null : <p>{'still here'}</p>}
    </section>
  );
}

/** The same, where the dismissal takes the intended target away as well. */
function Doomed() {
  const [isShown, setIsShown] = useState(true);
  const removing = useRef<HTMLSpanElement>(null);
  const gone = useRef<HTMLElement>(null);
  const returnFocus = useReturnFocus(removing, gone);

  return (
    <main>
      {isShown ? (
        <span ref={removing}>
          <button onClick={() => returnFocus(() => setIsShown(false))} type="button">
            {DISMISS}
          </button>
        </span>
      ) : null}
    </main>
  );
}

/** An `input` type that carries no selection, where `setSelectionRange` throws. */
function Numeric() {
  const [isShown, setIsShown] = useState(true);
  const removing = useRef<HTMLSpanElement>(null);
  const intended = useRef<HTMLInputElement>(null);
  const returnFocus = useReturnFocus(removing, intended);

  return (
    <section>
      <input aria-label={NUMBER} defaultValue={'7'} ref={intended} type="number" />
      {isShown ? (
        <span ref={removing}>
          <button onClick={() => returnFocus(() => setIsShown(false))} type="button">
            {DISMISS}
          </button>
        </span>
      ) : null}
    </section>
  );
}

describe('useReturnFocus', () => {
  it('puts focus on the intended element once the change has painted', async () => {
    render(<Row removesTheRow={false} />);

    fireEvent.click(screen.getByRole('button', { name: DISMISS }));

    await waitFor(() => {
      expect(screen.getByLabelText(INPUT)).toHaveFocus();
    });
  });

  it('puts the caret after the value, not in front of it', async () => {
    render(<Row removesTheRow={false} />);

    // What a real browser hands back for a field the User has never focused: no
    // selection to restore, so a bare focus() leaves the caret at index 0. jsdom
    // parks it at the end on its own, so the starting state is set here.
    screen.getByLabelText<HTMLInputElement>(INPUT).setSelectionRange(0, 0);

    fireEvent.click(screen.getByRole('button', { name: DISMISS }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(INPUT).selectionStart).toBe(VALUE.length);
    });
  });

  it('focuses a field that carries no selection without throwing', async () => {
    render(<Numeric />);

    fireEvent.click(screen.getByRole('button', { name: DISMISS }));

    await waitFor(() => {
      expect(screen.getByLabelText(NUMBER)).toHaveFocus();
    });
  });

  it('falls back to the nearest ancestor that outlived the change', async () => {
    render(<Doomed />);

    fireEvent.click(screen.getByRole('button', { name: DISMISS }));

    // A browser drops focus to the document body when the focused element
    // leaves, which returns a keyboard User to the top of the page.
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveFocus();
    });
  });

  it('makes that ancestor reachable without putting it in the tab order', async () => {
    render(<Doomed />);

    fireEvent.click(screen.getByRole('button', { name: DISMISS }));

    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    });
  });
});
