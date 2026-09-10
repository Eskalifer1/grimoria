import { locale } from 'next/root-params';

import { hasLocale, type Locale } from 'next-intl';

import { routing } from './routing';

/**
 * The active locale, from the `[locale]` root segment the proxy rewrote the
 * request onto.
 *
 * The segment rather than next-intl's own `requestLocale`, which falls back to
 * reading the request headers and takes every page out of static rendering with
 * it — the same reason `resolveTheme()` reads a root param.
 */
async function resolveLocale(): Promise<Locale> {
  const segment = await locale();

  return hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
}

export { resolveLocale };
