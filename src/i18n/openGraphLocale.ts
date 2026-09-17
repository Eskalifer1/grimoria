import type { Locale } from 'next-intl';

/**
 * Open Graph spells a locale `language_TERRITORY` (ogp.me → `og:locale`), and
 * the route carries only the language, so each one is mapped by hand.
 */
const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  en: 'en_US',
};

/** The `og:locale` value for a route locale. */
function toOpenGraphLocale(locale: Locale): string {
  return OPEN_GRAPH_LOCALE[locale];
}

export { toOpenGraphLocale };
