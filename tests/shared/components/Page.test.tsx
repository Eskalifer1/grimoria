import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Page } from '@/shared/components/Page';

import { renderWithProviders } from '../../setup/render';

// `Rule` is an async Server Component, which React Testing Library cannot
// render; its Theme branch is its own test's business.
vi.mock('@/shared/components/Rule', () => ({
  Rule: () => <hr />,
}));

// The status `p` under the title, or null when the page draws none.
function statusLine(): Element | null {
  return screen.getByRole('heading', { level: 1 }).nextElementSibling;
}

// The box opposite the title — a sibling of the title column, filled or not.
function asideBox(): Element {
  const box = screen.getByRole('heading', { level: 1 }).parentElement?.nextElementSibling;

  expect(box).not.toBeNull();

  return box as Element;
}

describe('Page', () => {
  it('renders one main landmark with the title as its one h1', () => {
    renderWithProviders(<Page title="Notes">body</Page>);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Notes');
  });

  it('draws the status line only when one is given', () => {
    const { rerender } = renderWithProviders(<Page title="Notes">body</Page>);

    expect(statusLine()).toBeNull();

    rerender(
      <Page status="12 notes" title="Notes">
        body
      </Page>,
    );

    expect(statusLine()).toHaveTextContent('12 notes');
  });

  it('keeps the aside box mounted whether or not it is filled', () => {
    const { rerender } = renderWithProviders(<Page title="Notes">body</Page>);

    expect(asideBox()).toBeEmptyDOMElement();

    rerender(
      <Page aside={<button type="button">Create</button>} title="Notes">
        body
      </Page>,
    );

    expect(asideBox()).toContainElement(screen.getByRole('button', { name: 'Create' }));
  });

  it('orders the offline sign, the masthead, the content and the bottom slot', () => {
    renderWithProviders(
      <Page bottomContent={<p>foot</p>} title="Notes">
        <p>body</p>
      </Page>,
    );

    const main = screen.getByRole('main');
    const order = [
      screen.getByRole('status'),
      screen.getByRole('heading', { level: 1 }),
      screen.getByRole('separator'),
      screen.getByText('body'),
      screen.getByText('foot'),
    ].map((node) => [...main.querySelectorAll('*')].indexOf(node));

    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
