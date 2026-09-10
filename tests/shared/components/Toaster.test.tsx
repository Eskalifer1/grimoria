import { act } from 'react';

import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { TOAST_MESSAGE } from '@/constants/toast';
import { Toaster } from '@/shared/components/Toaster';
import { raiseActionErrorToast, raiseSuccessToast } from '@/shared/components/Toaster/raiseToast';

import { messages, renderWithProviders } from '../../setup/render';

/** The region a screen reader hears, which is the only place a toast counts as said. */
function liveRegion(): HTMLElement {
  const region = document.querySelector('[aria-live]');

  expect(region).not.toBeNull();

  return region as HTMLElement;
}

describe('a toast raised over the mounted surface', () => {
  it('words a failure code from the active catalog', async () => {
    renderWithProviders(<Toaster />);

    act(() => {
      raiseActionErrorToast(ACTION_ERROR.FORBIDDEN);
    });

    await waitFor(() => {
      expect(liveRegion()).toHaveTextContent(messages.actionError.forbidden);
    });
  });

  it('words a success from the toast namespace', async () => {
    renderWithProviders(<Toaster />);

    act(() => {
      raiseSuccessToast(TOAST_MESSAGE.CREATED);
    });

    await waitFor(() => {
      expect(liveRegion()).toHaveTextContent(messages.toast.created);
    });
  });

  it('leaves one on screen when the same code is raised twice', async () => {
    renderWithProviders(<Toaster />);

    act(() => {
      raiseActionErrorToast(ACTION_ERROR.FORBIDDEN);
      raiseActionErrorToast(ACTION_ERROR.FORBIDDEN);
    });

    // The id is the code, and the library replaces rather than stacks. Asserted
    // against a real `<Toaster />` because nothing of ours enforces it.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-sonner-toast]')).toHaveLength(1);
    });
  });

  it('names its dismiss control in the same catalog', async () => {
    renderWithProviders(<Toaster />);

    act(() => {
      raiseActionErrorToast(ACTION_ERROR.UNEXPECTED);
    });

    // Present, not visible: the library fades a toast in from `opacity: 0` over a
    // frame jsdom never paints. What it looks like is the browser's to answer.
    expect(await screen.findByRole('button', { name: messages.toast.dismiss })).toBeInTheDocument();
  });
});
