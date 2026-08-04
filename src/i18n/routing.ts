import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',

  // `as-needed` keeps v1 URLs clean (`/notes`, not `/en/notes`) while the
  // `[locale]` segment already exists, so adding a second locale (#18) is a
  // routing config change rather than moving every route file.
  localePrefix: 'as-needed',
});
