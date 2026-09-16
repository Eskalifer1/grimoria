import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModalFrame } from '@/shared/components/ModalFrame';

import { renderWithProviders } from '../../setup/render';

const params = vi.hoisted(() => ({ current: {} as { theme?: string } }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useParams: () => params.current,
}));

function frame() {
  return document.querySelector('[data-slot=modal-frame]');
}

describe('ModalFrame', () => {
  it('draws nothing in standard', () => {
    params.current = { theme: 'standard' };

    renderWithProviders(<ModalFrame />);

    expect(frame()).toBeNull();
  });

  it('draws the filament frame in dark-fantasy, outside the accessibility tree', () => {
    params.current = { theme: 'dark-fantasy' };

    renderWithProviders(<ModalFrame />);

    expect(frame()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
