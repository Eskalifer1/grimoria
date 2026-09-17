import type meta from '../../messages/en/meta.json';
import { resolveLocale } from './resolveLocale';

/**
 * The `<head>` copy for one locale — `messages/<locale>/meta.json`. Keyed by
 * locale alone, not by Theme: a share card and a tab title are seen by people
 * with no Theme, and one URL gets one title.
 */
type MetaMessages = typeof meta;

/**
 * Reads the active locale's `meta.json`. Loaded here rather than through
 * `request.ts`, whose catalog is handed whole to `NextIntlClientProvider` —
 * head copy would ride to the client for nothing.
 */
async function getMetaMessages(): Promise<MetaMessages> {
  const locale = await resolveLocale();

  return (await import(`../../messages/${locale}/meta.json`)).default;
}

export type { MetaMessages };
export { getMetaMessages };
