import { Suspense } from 'react';

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MASCOT_POSE } from '@/constants/mascot';

vi.mock('next/dynamic', () => import('next/dist/api/app-dynamic'));
vi.mock('@/shared/assets/mascot/sad.svg', () => Promise.reject(new Error('chunk lost')));

describe('Mascot when its chunk fails to load', () => {
  it('leaves the surface standing with an empty box', async () => {
    const { Mascot } = await import('@/shared/components/Mascot');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <Suspense fallback={<p>SURFACE-FALLBACK</p>}>
        <h1>TITLE</h1>
        <Mascot pose={MASCOT_POSE.SAD} />
      </Suspense>,
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(container.textContent).toContain('TITLE');
    expect(container.querySelector('.mascot')).not.toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    spy.mockRestore();
  });
});
