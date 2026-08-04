import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';
import { resolveTheme } from './theme';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Theme selects *which catalog is loaded*, not which key is read — so
  // components call `t('home.title')` and stay unaware that a second tonality
  // exists. This is the `[locale][theme][key]` shape from ADR-0004 on disk.
  const theme = await resolveTheme();

  return {
    locale,
    messages: (await import(`../../messages/${locale}/${theme}.json`)).default,
  };
});
