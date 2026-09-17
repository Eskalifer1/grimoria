import { METADATA_BASE_URL } from '@/constants/env.server';
import type { FrontendRoute } from '@/constants/routes';
import { routing } from '@/i18n/routing';

/** The URL a locale serves a route on — the default locale bare, per `localePrefix: 'as-needed'`. */
function localizedUrl(route: FrontendRoute, locale: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const pathname = `${prefix}${route}`.replace(/\/$/, '') || '/';

  return new URL(pathname, METADATA_BASE_URL).href;
}

export { localizedUrl };
