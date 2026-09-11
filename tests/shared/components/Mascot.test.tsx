import { Suspense } from 'react';

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MASCOT_POSE } from '@/constants/mascot';
import { Mascot } from '@/shared/components/Mascot';

// The App Router build of `next/dynamic`; the default export Vitest resolves is
// the Pages one, which suspends differently.
vi.mock('next/dynamic', () => import('next/dist/api/app-dynamic'));

describe('Mascot', () => {
  // First, before another test has fetched a pose: a resolved chunk no longer suspends.
  it('shows a skeleton in its box and leaves the surface standing while the drawing loads', async () => {
    const { container } = render(
      <Suspense fallback={<p>SURFACE-FALLBACK</p>}>
        <h1>TITLE</h1>
        <Mascot pose={MASCOT_POSE.SAD} />
      </Suspense>,
    );

    expect(container.textContent).toContain('TITLE');
    expect(container.textContent).not.toContain('SURFACE-FALLBACK');
    expect(container.querySelector('.mascot svg[data-skeleton]')).not.toBeNull();

    await waitFor(() => expect(container.querySelector('svg:not([data-skeleton])')).not.toBeNull());
    expect(container.querySelector('svg[data-skeleton]')).toBeNull();
  });
  it('renders every pose as a drawing hidden from assistive technology', async () => {
    for (const pose of Object.values(MASCOT_POSE)) {
      const { container, unmount } = render(<Mascot pose={pose} />);

      await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
      expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
      unmount();
    }
  });

  it('takes a class over its default size', async () => {
    const { container } = render(<Mascot pose={MASCOT_POSE.IDLE} className="size-24" />);

    expect(container.querySelector('.mascot')).toHaveClass('size-24');
    expect(container.querySelector('.mascot')?.className).not.toContain('clamp');
  });
});
