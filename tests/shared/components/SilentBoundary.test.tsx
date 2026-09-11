import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SilentBoundary } from '@/shared/components/SilentBoundary';

function Throws(): never {
  throw new Error('broken part');
}

describe('SilentBoundary', () => {
  it('renders its children while they hold', () => {
    const { container } = render(
      <SilentBoundary>
        <p>PART</p>
      </SilentBoundary>,
    );

    expect(container.textContent).toBe('PART');
  });

  it('renders nothing once a child throws, and lets the rest of the surface stand', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <>
        <h1>TITLE</h1>
        <SilentBoundary>
          <Throws />
        </SilentBoundary>
      </>,
    );

    expect(container.textContent).toBe('TITLE');
    spy.mockRestore();
  });
});
