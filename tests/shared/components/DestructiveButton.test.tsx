import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DestructiveButton } from '@/shared/components/DestructiveButton';

import { renderWithProviders } from '../../setup/render';

const CONFIRM = {
  title: 'Delete the note?',
  confirmLabel: 'Delete',
  cancelLabel: 'Keep it',
};

describe('DestructiveButton', () => {
  it('sets both halves of the pair, so neither the fill nor the ink is inherited', () => {
    renderWithProviders(<DestructiveButton>Delete</DestructiveButton>);

    const button = screen.getByRole('button', { name: 'Delete' });

    expect(button).toHaveClass('bg-action-destructive-bg');
    expect(button).toHaveClass('text-action-destructive-fg');
  });

  it('drops the vendored classes it replaces, which no longer compile', () => {
    renderWithProviders(<DestructiveButton>Delete</DestructiveButton>);

    const classes = screen.getByRole('button', { name: 'Delete' }).className.split(' ');

    // The `dark:` copies survive and are inert: nothing here ever sets that class.
    expect(classes).not.toContain('text-white');
    expect(classes).not.toContain('bg-destructive');
    expect(classes).not.toContain('hover:bg-destructive/90');
  });

  it('lets a caller add classes without losing the pair', () => {
    renderWithProviders(<DestructiveButton className="w-full">Delete</DestructiveButton>);

    const button = screen.getByRole('button', { name: 'Delete' });

    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('bg-action-destructive-bg');
  });

  it('fires onClick directly without confirm', () => {
    const onClick = vi.fn();

    renderWithProviders(<DestructiveButton onClick={onClick}>Delete</DestructiveButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('opens a confirm dialog on click and waits for confirmation', () => {
    const onClick = vi.fn();

    renderWithProviders(
      <DestructiveButton confirm={CONFIRM} onClick={onClick}>
        Delete
      </DestructiveButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not submit a form around it before the User confirms', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    renderWithProviders(
      <form onSubmit={onSubmit}>
        <DestructiveButton confirm={CONFIRM}>Delete</DestructiveButton>
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('fires onClick once after the User confirms', () => {
    const onClick = vi.fn();

    renderWithProviders(
      <DestructiveButton confirm={CONFIRM} onClick={onClick}>
        Delete
      </DestructiveButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: CONFIRM.confirmLabel }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick after cancel', () => {
    const onClick = vi.fn();

    renderWithProviders(
      <DestructiveButton confirm={CONFIRM} onClick={onClick}>
        Delete
      </DestructiveButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: CONFIRM.cancelLabel }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
