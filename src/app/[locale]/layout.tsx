import type { Metadata } from 'next';
import {
  Barlow,
  JetBrains_Mono,
  Literata,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import { notFound } from 'next/navigation';

import { hasLocale, NextIntlClientProvider } from 'next-intl';

import { routing } from '@/i18n/routing';
import { resolveTheme } from '@/i18n/theme';
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
  title: 'Grimoria',
  description: "A personal knowledge base for saving and rediscovering things you've learned.",
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
