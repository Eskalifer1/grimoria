import { getTranslations } from 'next-intl/server';

import type { Theme } from '@/constants/theme';
import { resolveTheme } from '@/i18n/resolveTheme';
import LoadingRuneDarkFantasy from '@/shared/assets/marks/loading-rune-dark-fantasy.svg';
import LoadingRuneStandard from '@/shared/assets/marks/loading-rune-standard.svg';
import { cn } from '@/shared/lib/cn';

/** One drawing per Theme; `design/marks.md` is why they differ and where each is drawn. */
const RUNE: Record<Theme, typeof LoadingRuneStandard> = {
  standard: LoadingRuneStandard,
  'dark-fantasy': LoadingRuneDarkFantasy,
};

interface LoaderProps {
  /** Merged onto the drawing; a `size-*` here replaces the 32 px default, the floor `design/marks.md` sets. */
  className?: string;
}

/**
 * The app's one loading indicator — a Suspense fallback, a `loading.tsx`, a slot
 * on a client surface that waits. Server-side because the Theme is decided
 * there (`resolveTheme`); a client component takes it through a slot.
 */
async function Loader({ className }: LoaderProps) {
  const [theme, t] = await Promise.all([resolveTheme(), getTranslations('common')]);
  const Rune = RUNE[theme];

  return (
    <Rune
      role="status"
      aria-label={t('loading')}
      className={cn('size-8 text-text-brand', className)}
    />
  );
}

export { Loader };
