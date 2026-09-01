import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DestructiveButton } from '@/shared/components/DestructiveButton';

import { renderWithProviders } from '../../setup/render';

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
});
