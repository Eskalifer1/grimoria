import type { Metadata, Viewport } from 'next';

import { NextIntlClientProvider } from 'next-intl';

import { APP_NAME } from '@/constants/app';
import { METADATA_BASE_URL } from '@/constants/env.server';
import { THEME_COLOR, THEMES, type Theme } from '@/constants/theme';
import { getMetaMessages } from '@/i18n/metaMessages';
import { toOpenGraphLocale } from '@/i18n/openGraphLocale';
import { resolveLocale } from '@/i18n/resolveLocale';
import { resolveTheme } from '@/i18n/resolveTheme';
import { routing } from '@/i18n/routing';
import { OptimisticScope } from '@/shared/components/OptimisticScope';
import { SyncProgressBar } from '@/shared/components/SyncProgressBar';
import { Toaster } from '@/shared/components/Toaster';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { FONT_VARIABLES } from '@/shared/config/fonts';

import '../../globals.css';

// Every page's head starts here: the base URL, the title template, the default
// description and the Open Graph and Twitter defaults. A page adds its own with
// `pageMetadata(namespace)` — `docs/features/metadata.md`.
export async function generateMetadata(): Promise<Metadata> {
  const [locale, { site }] = await Promise.all([resolveLocale(), getMetaMessages()]);
  const description = site.description;

  return {
    // `opengraph-image.jpg` sits beside this file, and Open Graph needs absolute
    // URLs; without a base Next resolves it against localhost and the card 404s
    // wherever the link is actually shared.
    metadataBase: new URL(METADATA_BASE_URL),
    title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
    description,
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      locale: toOpenGraphLocale(locale),
      title: APP_NAME,
      description,
    },
    // Next mirrors the `opengraph-image` file into `twitter:image`, so a second
    // copy of the same card would only add bytes. This picks the large layout.
    twitter: { card: 'summary_large_image' },
    // Without this an iOS shortcut opens in Safari Chrome rather than standalone.
    appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
  };
}

// The browser Chrome around the page, which `manifest.ts` cannot reach — that
// one is read at install time only. One color per Theme, never per color
// scheme: the OS picks no Theme here (`docs/features/dark-fantasy-theme.md`).
export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: THEME_COLOR[await resolveTheme()],
    // Without it every `env(safe-area-inset-*)` reads 0 on a notched phone.
    viewportFit: 'cover',
  };
}

// The whole product is built ahead of any request: every Theme against every
// locale, which is only two pages while #18 is open.
export function generateStaticParams(): Array<{ theme: Theme; locale: string }> {
  return THEMES.flatMap((theme) => routing.locales.map((locale) => ({ theme, locale })));
}

export default async function LocaleLayout({ children }: LayoutProps<'/[theme]/[locale]'>) {
  // Narrowed, not raw: a root layout may not throw `notFound()`, so an unknown
  // segment is refused by `(site)/layout.tsx` below and this html stays valid.
  const [theme, locale] = await Promise.all([resolveTheme(), resolveLocale()]);

  return (
    // `data-theme` is written for `standard` too: #39 asserts on it, and "no
    // attribute" must not read the same as "the default Theme".
    <html lang={locale} data-theme={theme} className={FONT_VARIABLES}>
      <body>
        <NextIntlClientProvider>
          {/* Above every surface and before it: one localStorage slot serves the
              whole browser, so a machine two Users share must not render the
              first one's unsaved work to the second. */}
          <OptimisticScope />
          {/* At the very top until there is a header to sit under (#1), which is
              where it stays on a small screen either way. */}
          <SyncProgressBar className="fixed inset-x-0 top-0 z-50" />
          {/* Radix throws on a `Tooltip` outside its provider; one here serves
              every surface, and the delay is decided once. */}
          <TooltipProvider>{children}</TooltipProvider>
          {/* Last, so the live region it mounts sits after the page's own
              content in the reading order and a toast is announced where the
              User already is. */}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
