import type { Metadata, Viewport } from 'next';
import {
  Barlow,
  JetBrains_Mono,
  Literata,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import { notFound } from 'next/navigation';

import { hasLocale, NextIntlClientProvider } from 'next-intl';

import { getCurrentUser } from '@/api/user/getCurrentUser';
import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { METADATA_BASE_URL } from '@/constants/env.server';
import { resolveTheme } from '@/i18n/resolveTheme';
import { routing } from '@/i18n/routing';
import { OptimisticScope } from '@/shared/components/OptimisticScope';
import { SyncProgressBar } from '@/shared/components/SyncProgressBar';
import { cn } from '@/shared/lib/cn';

import '../globals.css';

// Both Themes' families are declared, but a face is only fetched once rendered
// text resolves to it — which is why `preload` is off: a preload link fetches
// regardless, and half of these are unused on any render. Revisited in #75.
// Weights are omitted where the family has a variable axis; Barlow has none (#54).
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  preload: false,
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  preload: false,
});

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  preload: false,
});

const literata = Literata({
  variable: '--font-literata',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  preload: false,
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  preload: false,
});

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
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Written for `standard` too: #39 asserts on this attribute, and "no
  // attribute" must not read the same as "the default Theme".
  const [theme, user] = await Promise.all([resolveTheme(), getCurrentUser()]);

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={cn(
        plusJakartaSans.variable,
        playfairDisplay.variable,
        barlow.variable,
        literata.variable,
        jetBrainsMono.variable,
      )}
    >
      <body>
        <NextIntlClientProvider>
          {/* Above every surface and before it: one localStorage slot serves the
              whole browser, so a machine two Users share must not render the
              first one's unsaved work to the second. */}
          <OptimisticScope scope={user?.id ?? null} />
          {/* At the very top until there is a header to sit under (#1), which is
              where it stays on a small screen either way. */}
          <SyncProgressBar className="fixed inset-x-0 top-0 z-50" />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
