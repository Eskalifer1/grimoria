import { useState } from 'react';

import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AlertModal, type AlertModalProps } from '@/shared/components/AlertModal';

import { renderWithProviders } from '../../setup/render';

const TITLE = 'Delete the note?';
const DESCRIPTION = 'It goes for good.';
const CANCEL = 'Keep it';
const ACTION = 'Delete';
const OPEN = 'Open';

type HarnessProps = Partial<Pick<AlertModalProps, 'size' | 'onOpenChange'>> & {
  /** Hides the title visually. */
  isSrOnly?: boolean;

  /** Runs when the action is chosen. */
  onAction?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /** The action's tone. */
  tone?: 'default' | 'destructive';
};

/** A page holding the alert the way a page does: a trigger, and the open flag as its own state. */
function Harness({ size, onOpenChange, isSrOnly, onAction, tone }: HarnessProps) {
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        {OPEN}
      </button>
      <AlertModal onOpenChange={handleOpenChange} open={open} size={size}>
        <AlertModal.Header>
          <AlertModal.Title isSrOnly={isSrOnly}>{TITLE}</AlertModal.Title>
          <AlertModal.Description>{DESCRIPTION}</AlertModal.Description>
        </AlertModal.Header>
        <AlertModal.Body>
          <p>Body</p>
        </AlertModal.Body>
        <AlertModal.Footer>
          <AlertModal.Cancel>{CANCEL}</AlertModal.Cancel>
          <AlertModal.Action onClick={onAction} tone={tone}>
            {ACTION}
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal>
    </>
  );
}

function dialog() {
  return screen.getByRole('alertdialog');
}

async function open() {
  const trigger = screen.getByRole('button', { name: OPEN });

  // A real click focuses the button first; `fireEvent` does not, and the focus
  // that returns on close is whatever was focused when the panel opened.
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('alertdialog');
  // Radix registers its outside-pointer listener a tick after the panel mounts.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

/** A pointer landing on the page behind the panel, the way a click there arrives. */
function clickPast() {
  fireEvent.pointerDown(document.body);
  fireEvent.click(document.body);
}

function expectClosed() {
  return waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
}

describe('AlertModal', () => {
  it('renders as an alert dialog with every part', async () => {
    renderWithProviders(<Harness />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await open();

    const panel = dialog();

    expect(within(panel).getByText(TITLE)).toBeInTheDocument();
    expect(within(panel).getByText(DESCRIPTION)).toBeInTheDocument();
    expect(within(panel).getByText('Body')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: CANCEL })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: ACTION })).toBeInTheDocument();
  });

  it('is labelled by its title and described by its description', async () => {
    renderWithProviders(<Harness />);
    await open();

    expect(dialog()).toHaveAccessibleName(TITLE);
    expect(dialog()).toHaveAccessibleDescription(DESCRIPTION);
  });

  it('is still labelled by a title rendered for screen readers only', async () => {
    renderWithProviders(<Harness isSrOnly />);
    await open();

    expect(dialog()).toHaveAccessibleName(TITLE);
    expect(screen.getByText(TITLE)).toHaveClass('sr-only');
  });

  it('opens with focus on the cancel control', async () => {
    renderWithProviders(<Harness />);
    await open();

    expect(screen.getByRole('button', { name: CANCEL })).toHaveFocus();
  });

  it('closes on Cancel and returns focus to the trigger', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    fireEvent.click(screen.getByRole('button', { name: CANCEL }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
    // Radix hands focus back a tick after the panel is gone.
    await waitFor(() => expect(screen.getByRole('button', { name: OPEN })).toHaveFocus());
  });

  it('runs the action and closes on Action', async () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onAction={onAction} onOpenChange={onOpenChange} />);
    await open();

    fireEvent.click(screen.getByRole('button', { name: ACTION }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
  });

  it('stays open when the action prevents the default', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(
      <Harness onAction={(event) => event.preventDefault()} onOpenChange={onOpenChange} />,
    );
    await open();

    fireEvent.click(screen.getByRole('button', { name: ACTION }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    fireEvent.keyDown(dialog(), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
  });

  it('ignores a click past it', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    clickPast();
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
  });

  it('paints the destructive pair on a destructive action', async () => {
    renderWithProviders(<Harness tone="destructive" />);
    await open();

    const action = screen.getByRole('button', { name: ACTION });

    expect(action).toHaveClass('bg-action-destructive-bg');
    expect(action).toHaveClass('text-action-destructive-fg');
  });
});
