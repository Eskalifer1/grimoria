import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * This jsdom build ships no `localStorage`, so without this the optimistic store
 * runs memory-only in every component test and nothing that claims to survive a
 * reload is ever proved. A `Map` behind the four methods the store uses is the
 * whole contract (`src/shared/lib/optimistic/store.ts`).
 */
function installStorage() {
  const slots = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => slots.get(key) ?? null,
      setItem: (key: string, value: string) => void slots.set(key, value),
      removeItem: (key: string) => void slots.delete(key),
      clear: () => slots.clear(),
    },
  });
}

if (window.localStorage === undefined) {
  installStorage();
}

afterEach(cleanup);
