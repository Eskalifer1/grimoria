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

import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { resolveTheme } from '@/i18n/resolveTheme';
import { routing } from '@/i18n/routing';
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
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'),
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
  const theme = await resolveTheme();

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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
