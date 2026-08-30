import type { ReactElement } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { expect } from 'vitest';

import messages from '../../messages/en/standard.json';

/**
 * Renders a component inside the providers every component test needs. The
 * `standard` catalog is the one asserted against — a Theme's own wording is an
 * e2e concern (#39), not a reason for every test to pick a catalog.
 */
function renderWithProviders(ui: ReactElement) {
  const withProviders = (node: ReactElement) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
  const result = render(withProviders(ui));

  // Rendering again through the same providers, so a test can move a prop the
  // way a parent does — `rerender` on its own replaces the providers too.
  return { ...result, rerender: (node: ReactElement) => result.rerender(withProviders(node)) };
}

/** Every live region on the surface that currently has something to say. */
function speakingRegions(): HTMLElement[] {
  return [...screen.queryAllByRole('alert'), ...screen.queryAllByRole('status')].filter(
    (region) => region.textContent !== '',
  );
}

/**
 * Asserts that nothing is being announced. Every alert region stays mounted
 * whether or not it has anything to say — one created together with its text is
 * not a content change and most screen readers stay silent — so "silent" is an
 * empty region, never an absent one.
 */
function expectNothingAnnounced() {
  expect(speakingRegions()).toEqual([]);
}

/**
 * The one region that has something to say. Every other alert region on the
 * surface is mounted and empty, so `getByRole('alert')` would find several.
 */
function announced(): HTMLElement {
  const speaking = speakingRegions();

  expect(speaking).toHaveLength(1);

  return speaking[0] as HTMLElement;
}

/** The same, once whatever is being waited on has said it. */
function findAnnounced(): Promise<HTMLElement> {
  return waitFor(announced);
}

export { announced, expectNothingAnnounced, findAnnounced, messages, renderWithProviders };
