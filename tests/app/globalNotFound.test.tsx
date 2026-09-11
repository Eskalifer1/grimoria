import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GlobalNotFound from '@/app/global-not-found';

describe('GlobalNotFound', () => {
  it('owns one h1 and a way home, with no provider above it', () => {
    // Reached only by a path the proxy never rewrote, so no Theme and no
    // locale exist — the copy has to be its own.
    render(<GlobalNotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });
});
