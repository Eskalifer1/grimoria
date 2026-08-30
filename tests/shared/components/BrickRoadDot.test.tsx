import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { ROUTES } from '@/constants/routes';
import { BrickRoadDot } from '@/shared/components/BrickRoadDot';

import { messages, renderWithProviders } from '../../setup/render';

const copy = messages.optimistic;

const ROAD = {
  status: ACTION_STATUS.FAILURE,
  reason: ACTION_ERROR.UNEXPECTED,
  targetHref: ROUTES.PROFILE,
};

describe('BrickRoadDot', () => {
  it('renders nothing when nothing below is wrong', () => {
    const { container } = renderWithProviders(<BrickRoadDot road={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link the User can follow to the problem', () => {
    renderWithProviders(<BrickRoadDot road={ROAD} />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', expect.stringContaining(ROUTES.PROFILE));
  });

  it('resolves to a name a screen reader can speak', () => {
    renderWithProviders(<BrickRoadDot road={ROAD} />);

    expect(screen.getByRole('link')).toHaveAccessibleName(copy.problem);
  });

  it('marks the road with the failure color', () => {
    const { container } = renderWithProviders(<BrickRoadDot road={ROAD} />);

    expect(container.querySelector('.bg-status-failed')).not.toBeNull();
  });

  it('merges a caller class onto the root', () => {
    const { container } = renderWithProviders(<BrickRoadDot className="ml-1" road={ROAD} />);

    expect(container.firstElementChild).toHaveClass('ml-1');
  });
});
