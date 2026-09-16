import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TooltipText } from '@/shared/components/TooltipText';

import { renderWithProviders } from '../../setup/render';

describe('TooltipText', () => {
  it('draws the text, focusable, with the tooltip closed', () => {
    renderWithProviders(<TooltipText tooltip="Full title">Trunc…</TooltipText>);

    expect(screen.getByText('Trunc…')).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on focus, describes the text and closes on Escape', async () => {
    renderWithProviders(<TooltipText tooltip="Full title">Trunc…</TooltipText>);

    const trigger = screen.getByText('Trunc…');
    act(() => trigger.focus());
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Full title');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });
});
