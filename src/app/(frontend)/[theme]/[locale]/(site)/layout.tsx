import { notFound } from 'next/navigation';

import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { isTheme } from '@/i18n/theme';

/**
 * Refuses a `theme` or `locale` outside the generated set. Cache Components
 * forbid `dynamicParams = false`, and `notFound()` may not be thrown from the
 * root layout, so the guard sits one segment below it and the group's own
 * `not-found.tsx` answers. The proxy can be bypassed with a dotted path; this
 * cannot.
 */
export default async function SiteLayout({ children, params }: LayoutProps<'/[theme]/[locale]'>) {
  const { theme, locale } = await params;

  if (!isTheme(theme) || !hasLocale(routing.locales, locale)) {
    notFound();
  }

  return children;
}
