import type { MetadataRoute } from 'next';

import { METADATA_BASE_URL } from '@/constants/env.server';
import { type FrontendRoute, PUBLIC_ROUTES } from '@/constants/routes';
import { routing } from '@/i18n/routing';

/** The URL a locale serves a route on — the default locale bare, per `localePrefix: 'as-needed'`. */
function localizedUrl(route: FrontendRoute, locale: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const pathname = `${prefix}${route}`.replace(/\/$/, '') || '/';

  return new URL(pathname, METADATA_BASE_URL).href;
}

// Read once at build, not per request: a `Date` inside the render marks the
// route dynamic under `cacheComponents`, and a per-request date is noise.
const BUILT_AT = new Date();

/**
 * Every route in `PUBLIC_ROUTES`, absolute, with an alternate per locale and an
 * `x-default`. Theme is a cookie, so no URL carries it. Reads no data, so Next
 * renders it static; published public Notes join it once #2 lands.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(PUBLIC_ROUTES).map((route) => {
    const url = localizedUrl(route, routing.defaultLocale);
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, localizedUrl(route, locale)]),
    );

    return {
      url,
      lastModified: BUILT_AT,
      alternates: { languages: { ...languages, 'x-default': url } },
    };
  });
}
