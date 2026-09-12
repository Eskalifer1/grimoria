import type { Metadata, Viewport } from 'next';

import { NextIntlClientProvider } from 'next-intl';

import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { METADATA_BASE_URL } from '@/constants/env.server';
import { THEMES, type Theme } from '@/constants/theme';
import { routing } from '@/i18n/routing';
import { OptimisticScope } from '@/shared/components/OptimisticScope';
import { SyncProgressBar } from '@/shared/components/SyncProgressBar';
import { Toaster } from '@/shared/components/Toaster';
import { FONT_VARIABLES } from '@/shared/config/fonts';

import '../../globals.css';

export const metadata: Metadata = {
  // `opengraph-image.jpg` sits beside this file, and Open Graph needs absolute
  // URLs; without a base Next resolves it against localhost and the card 404s
  // wherever the link is actually shared.
  metadataBase: new URL(METADATA_BASE_URL),
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  // Next mirrors the `opengraph-image` file into `twitter:image`, so a second
  // copy of the same card would only add bytes. This picks the large layout.
  twitter: { card: 'summary_large_image' },
  // Without this an iOS shortcut opens in Safari Chrome rather than standalone.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
};

// The browser Chrome around the page, which `manifest.ts` cannot reach — that
// one is read at install time only. Both Themes' `--surface-page`.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfe' },
    { media: '(prefers-color-scheme: dark)', color: '#171614' },
  ],
  // Without it every `env(safe-area-inset-*)` reads 0 on a notched phone.
  viewportFit: 'cover',
};

// The whole product is built ahead of any request: every Theme against every
// locale, which is only two pages while #18 is open.
export function generateStaticParams(): Array<{ theme: Theme; locale: string }> {
  return THEMES.flatMap((theme) => routing.locales.map((locale) => ({ theme, locale })));
}

// Neither segment is reachable from outside, so anything not generated above is
// an address that does not exist — a 404 with no code of ours.
export const dynamicParams = false;

export default async function LocaleLayout({ children, params }: LayoutProps<'/[theme]/[locale]'>) {
  const { theme, locale } = await params;

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
          {children}
          {/* Last, so the live region it mounts sits after the page's own
              content in the reading order and a toast is announced where the
              User already is. */}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
