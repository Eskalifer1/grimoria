import { useState } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

import { messages, renderWithProviders } from '../../setup/render';

const TITLE = 'Delete the note?';
const CONFIRM = 'Delete';
const CANCEL = 'Keep it';

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(true);

  return (
    <ConfirmDialog
      cancelLabel={CANCEL}
      confirmLabel={CONFIRM}
      onConfirm={onConfirm}
      onOpenChange={setOpen}
      open={open}
      title={TITLE}
    />
  );
}

describe('ConfirmDialog', () => {
  it('calls onConfirm and closes on confirm', async () => {
    const onConfirm = vi.fn();

    renderWithProviders(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('tells the parent it closed once, not once per closing path', () => {
    const onOpenChange = vi.fn();

    renderWithProviders(
      <ConfirmDialog
        cancelLabel={CANCEL}
        confirmLabel={CONFIRM}
        onConfirm={() => undefined}
        onOpenChange={onOpenChange}
        open
        title={TITLE}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('words both answers itself when the page names neither', () => {
    renderWithProviders(
      <ConfirmDialog
        onConfirm={() => undefined}
        onOpenChange={() => undefined}
        open
        title={TITLE}
      />,
    );

    expect(screen.getByRole('button', { name: messages.modal.confirm })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.modal.cancel })).toBeInTheDocument();
  });

  it('does not call onConfirm on cancel', () => {
    const onConfirm = vi.fn();

    renderWithProviders(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: CANCEL }));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
