import { useTranslations } from 'next-intl';

import { NODE_ENVIRONMENT } from '@/constants/env.public';
import { Page } from '@/shared/components/Page';
import { Button } from '@/shared/components/ui/button';

import { ModalPlayground } from './ModalPlayground';
import { PrimitivesPlayground } from './PrimitivesPlayground';

// Placeholder surface until real screens exist (#75, #76). Its only job is to
// prove the pipeline end to end: switching the `theme` cookie changes every
// string and every token below without this file changing at all.
function HomePage() {
  const t = useTranslations('homePage');

  return (
    <Page title={t('title')}>
      <section className="rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card">
        <p className="font-ui text-text-muted">{t('empty')}</p>
        <Button className="mt-6">{t('createNote')}</Button>
        {NODE_ENVIRONMENT !== 'production' ? (
          <>
            <ModalPlayground />
            <PrimitivesPlayground />
          </>
        ) : null}
      </section>
    </Page>
  );
}

export { HomePage };
