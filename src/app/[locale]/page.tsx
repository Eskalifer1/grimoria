import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';

// Placeholder surface until real screens exist (#75, #76). Its only job is to
// prove the pipeline end to end: switching the `theme` cookie changes every
// string and every token below without this file changing at all.
export default function HomePage() {
  const t = useTranslations('homePage');

  return (
    <main className="p-8">
      <section className="rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card">
        <h1 className="font-display text-2xl text-text-title">{t('title')}</h1>
        <p className="mt-2 font-ui text-text-muted">{t('empty')}</p>
        <Button className="mt-6">{t('createNote')}</Button>
      </section>
    </main>
  );
}
