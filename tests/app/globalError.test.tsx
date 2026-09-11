import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  it('says what happened in words of its own', () => {
    // No provider: this boundary replaces the root layout, so a catalog is
    // exactly what it cannot reach.
    render(<GlobalError error={new Error('boom')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('keeps the thrown message out and the digest in', () => {
    render(
      <GlobalError
        error={Object.assign(new Error('boom'), { digest: 'd4e5f6' })}
        reset={vi.fn()}
      />,
    );

    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    expect(screen.getByText(/d4e5f6/)).toBeInTheDocument();
  });

  it('re-renders the root layout when the reload is pressed', () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button'));

    expect(reset).toHaveBeenCalledOnce();
  });
});
