import type { ReactElement } from 'react';

import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '../../messages/en/standard.json';

/**
 * Renders a component inside the providers every component test needs. The
 * `standard` catalog is the one asserted against — a Theme's own wording is an
 * e2e concern (#39), not a reason for every test to pick a catalog.
 */
function renderWithProviders(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

export { messages, renderWithProviders };
