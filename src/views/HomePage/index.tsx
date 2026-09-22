import { getTranslations } from 'next-intl/server';

import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { resolveTheme } from '@/i18n/resolveTheme';
import { Page } from '@/shared/components/Page';
import { Button } from '@/shared/components/ui/button';

import { ModalPlayground } from './ModalPlayground';
import { PrimitivesPlayground } from './PrimitivesPlayground';

// Placeholder surface until real screens exist (#75, #76). Its only job is to
// prove the pipeline end to end: switching the `theme` cookie changes every
// string and every token below without this file changing at all.
async function HomePage() {
  const t = await getTranslations('homePage');
  const theme = await resolveTheme();

  return (
    <Page title={t('title')}>
      <section className="rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card">
        <p className="font-ui text-text-muted">{t('empty')}</p>
        <Button className="mt-6">{t('createNote')}</Button>
        <ModalPlayground />
        <PrimitivesPlayground />
        {/* Lives here until Settings (#5); `e2e/theme.spec.ts` drives it on this page. */}
        <ThemeToggle theme={theme} />
      </section>
    </Page>
  );
}

export { HomePage };
