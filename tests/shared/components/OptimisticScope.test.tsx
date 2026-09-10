import type { ReactElement } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { OPTIMISTIC_SCOPE_COOKIE_NAME } from '@/constants/optimistic';
import { OptimisticScope } from '@/shared/components/OptimisticScope';
import { OptimisticStoreContext } from '@/shared/hooks/useOptimisticStore';
import { createOptimisticStore } from '@/shared/lib/optimistic/store';

import { renderWithProviders } from '../../setup/render';

function withCookie(value: string | null): ReactElement {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not in this jsdom, and the cookie is what the component reads
  document.cookie = `${OPTIMISTIC_SCOPE_COOKIE_NAME}=${value ?? ''}; path=/`;

  return <OptimisticScope />;
}

afterEach(() => {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not in this jsdom, and the cookie is what the component reads
  document.cookie = `${OPTIMISTIC_SCOPE_COOKIE_NAME}=; path=/; max-age=0`;
});

describe('OptimisticScope', () => {
  it('takes the scope from the cookie, with no request of its own', () => {
    const store = createOptimisticStore();
    const setScope = vi.spyOn(store, 'setScope');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderWithProviders(
      <OptimisticStoreContext.Provider value={store}>
        {withCookie('user-1')}
      </OptimisticStoreContext.Provider>,
    );

    expect(setScope).toHaveBeenCalledWith('user-1');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('scopes to nobody when the cookie was cleared, which is what sign-out does', () => {
    const store = createOptimisticStore();
    const setScope = vi.spyOn(store, 'setScope');

    renderWithProviders(
      <OptimisticStoreContext.Provider value={store}>
        {withCookie(null)}
      </OptimisticStoreContext.Provider>,
    );

    expect(setScope).toHaveBeenCalledWith(null);
  });
});
