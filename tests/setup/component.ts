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

/**
 * jsdom implements no `ResizeObserver`, and Radix measures the control it hides
 * behind a toggle with one — so a checkbox or a switch throws on mount rather
 * than rendering. Nothing here asserts on a size, so an observer that never
 * reports is the whole stand-in.
 */
class NoopResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * Radix's `Select` captures the pointer and scrolls the open list into view; jsdom
 * has neither, so the keypress that opens the list throws before an option
 * renders. Only what is missing is filled — this patches every component test.
 */
function installPointerApis() {
  if (Element.prototype.hasPointerCapture === undefined) {
    Element.prototype.hasPointerCapture = () => false;
  }

  if (Element.prototype.setPointerCapture === undefined) {
    Element.prototype.setPointerCapture = () => undefined;
  }

  if (Element.prototype.releasePointerCapture === undefined) {
    Element.prototype.releasePointerCapture = () => undefined;
  }

  if (Element.prototype.scrollIntoView === undefined) {
    Element.prototype.scrollIntoView = () => undefined;
  }
}

/**
 * This jsdom build ships no `matchMedia`, and `sonner` asks it for
 * `prefers-reduced-motion` on mount — so the toaster throws before a toast is
 * ever raised. Every query answers "not matched": a preference is a browser
 * fact, and what it changes is asserted there rather than here.
 */
function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

installPointerApis();

if (window.matchMedia === undefined) {
  installMatchMedia();
}

if (window.localStorage === undefined) {
  installStorage();
}

if (window.ResizeObserver === undefined) {
  window.ResizeObserver = NoopResizeObserver;
}

afterEach(cleanup);
