import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundary from '@/app/(frontend)/[theme]/[locale]/error';

import { messages, renderWithProviders } from '../setup/render';

const copy = messages.errorBoundary;
const SECRET = 'relation "users" does not exist';

function thrown(digest?: string): Error & { digest?: string } {
  return Object.assign(new Error(SECRET), digest ? { digest } : {});
}

describe('ErrorBoundary', () => {
  it('names the failure without repeating what was thrown', () => {
    renderWithProviders(<ErrorBoundary error={thrown()} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.title);
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it('renders the digest as a reference when Next supplies one', () => {
    renderWithProviders(<ErrorBoundary error={thrown('a1b2c3')} reset={vi.fn()} />);

    expect(screen.getByText(copy.reference.replace('{digest}', 'a1b2c3'))).toBeInTheDocument();
  });

  it('renders no reference line when there is no digest', () => {
    renderWithProviders(<ErrorBoundary error={thrown()} reset={vi.fn()} />);

    expect(screen.queryByText(/Reference/)).not.toBeInTheDocument();
  });

  it('re-renders the segment when the retry is pressed', () => {
    const reset = vi.fn();

    renderWithProviders(<ErrorBoundary error={thrown()} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: copy.retry }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('offers a way home', () => {
    renderWithProviders(<ErrorBoundary error={thrown()} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: messages.common.backHome })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
