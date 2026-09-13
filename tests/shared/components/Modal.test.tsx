import { useState } from 'react';

import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { Form } from '@/shared/components/Form';
import { Modal, type ModalProps } from '@/shared/components/Modal';
import { actionFailure } from '@/shared/lib/actionResult';
import { IDLE_FORM_STATUS } from '@/shared/lib/formStatus';

import { messages, renderWithProviders } from '../../setup/render';

const TITLE = 'Rename the note';
const DESCRIPTION = 'The new name shows everywhere the note is listed.';
const CLOSE = 'Not now';
const ACTION = 'Rename';
const OPEN = 'Open';

type HarnessProps = Partial<Pick<ModalProps, 'size' | 'onOpenChange'>> & {
  /** Hides the title visually. */
  isSrOnly?: boolean;

  /** Leaves the description out. */
  withoutDescription?: boolean;

  /** The action's tone. */
  tone?: 'default' | 'destructive';
};

/** A page holding the modal the way a page does: a trigger, and the open flag as its own state. */
function Harness({ size, onOpenChange, isSrOnly, withoutDescription, tone }: HarnessProps) {
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
      <Modal onOpenChange={handleOpenChange} open={open} size={size}>
        <Modal.Header>
          <Modal.Title isSrOnly={isSrOnly}>{TITLE}</Modal.Title>
          {withoutDescription ? null : <Modal.Description>{DESCRIPTION}</Modal.Description>}
        </Modal.Header>
        <Modal.Body>
          <p>Body</p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>{CLOSE}</Modal.Close>
          <Modal.Action tone={tone}>{ACTION}</Modal.Action>
        </Modal.Footer>
      </Modal>
    </>
  );
}

/** A form inside the modal, with the write already refused by the server. */
function FormHarness() {
  const form = useForm({ defaultValues: { name: 'Morgan' } });
  const writeStatus = {
    ...IDLE_FORM_STATUS,
    error: actionFailure(ACTION_ERROR.UNAUTHENTICATED).error,
  };

  return (
    <Modal onOpenChange={() => undefined} open>
      <Modal.Title>{TITLE}</Modal.Title>
      <Modal.Body>
        <Form.Root form={form} onSubmit={() => undefined} writeStatus={writeStatus}>
          <Form.Footer />
        </Form.Root>
      </Modal.Body>
    </Modal>
  );
}

function dialog() {
  return screen.getByRole('dialog');
}

async function open() {
  const trigger = screen.getByRole('button', { name: OPEN });

  // A real click focuses the button first; `fireEvent` does not, and the focus
  // that returns on close is whatever was focused when the panel opened.
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog');
  // Radix registers its outside-pointer listener a tick after the panel mounts.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

/** A pointer landing on the page behind the panel, the way a click there arrives. */
function clickPast() {
  fireEvent.pointerDown(document.body);
  fireEvent.click(document.body);
}

function expectClosed() {
  return waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

describe('Modal', () => {
  it('renders nothing until opened, and every part once it is', async () => {
    renderWithProviders(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await open();

    const panel = dialog();

    expect(within(panel).getByText(TITLE)).toBeInTheDocument();
    expect(within(panel).getByText(DESCRIPTION)).toBeInTheDocument();
    expect(within(panel).getByText('Body')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: CLOSE })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: ACTION })).toBeInTheDocument();
  });

  it('draws no close button of its own, since its label would be untranslated', async () => {
    renderWithProviders(<Harness />);
    await open();

    expect(within(dialog()).getAllByRole('button')).toHaveLength(2);
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

  it('has no description when none is composed', async () => {
    renderWithProviders(<Harness withoutDescription />);
    await open();

    expect(dialog()).not.toHaveAttribute('aria-describedby');
  });

  it('reports a close through onOpenChange and closes on Modal.Close', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    fireEvent.click(screen.getByRole('button', { name: CLOSE }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
  });

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    fireEvent.keyDown(dialog(), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
  });

  it('closes on a click past it', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(<Harness onOpenChange={onOpenChange} />);
    await open();

    clickPast();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expectClosed();
  });

  it('moves focus inside on open and back to the trigger on close', async () => {
    renderWithProviders(<Harness />);
    await open();

    expect(dialog().contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(dialog(), { key: 'Escape' });
    await expectClosed();

    // Radix hands focus back a tick after the panel is gone.
    await waitFor(() => expect(screen.getByRole('button', { name: OPEN })).toHaveFocus());
  });

  it('paints the destructive pair on a destructive action', async () => {
    renderWithProviders(<Harness tone="destructive" />);
    await open();

    const action = screen.getByRole('button', { name: ACTION });

    expect(action).toHaveClass('bg-action-destructive-bg');
    expect(action).toHaveClass('text-action-destructive-fg');
  });

  it('paints nothing destructive by default', async () => {
    renderWithProviders(<Harness />);
    await open();

    expect(screen.getByRole('button', { name: ACTION })).not.toHaveClass(
      'bg-action-destructive-bg',
    );
  });

  it('shows a footer failure of a form it holds inside the panel', () => {
    renderWithProviders(<FormHarness />);

    expect(within(dialog()).getByRole('alert')).toHaveTextContent(
      messages.actionError.unauthenticated,
    );
  });
});
