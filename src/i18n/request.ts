import { getRequestConfig } from 'next-intl/server';

import { resolveLocale } from './resolveLocale';
import { resolveTheme } from './resolveTheme';

export default getRequestConfig(async () => {
  // Both come from the root segments the proxy rewrote onto, so nothing here
  // reads a cookie or a header and every page can still be built ahead.
  const [locale, theme] = await Promise.all([resolveLocale(), resolveTheme()]);

  // Theme selects *which catalog is loaded*, not which key is read — so
  // components call `t('homePage.title')` and stay unaware that a second tonality
  // exists. This is the `[locale][theme][key]` shape from ADR-0004 on disk.
  return {
    locale,
    messages: (await import(`../../messages/${locale}/${theme}.json`)).default,
  };
});
