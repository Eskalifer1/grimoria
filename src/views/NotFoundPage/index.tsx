import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/shared/components/EmptyState';
import { FullPageView } from '@/shared/components/FullPageView';
import { Button } from '@/shared/components/ui/button';

/**
 * Both 404 cases at once: an address Next matched no route for, and a page that
 * called `notFound()`. The proxy rewrites every non-excluded path under
 * `[theme]/[locale]`, so an unmatched URL arrives here already Themed.
 */
function NotFoundPage() {
  const t = useTranslations('notFoundPage');
  const common = useTranslations('common');

  return (
    <FullPageView>
      <EmptyState
        heading="h1"
        title={t('title')}
        description={t('description')}
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.HOME}>{common('backHome')}</Link>
          </Button>
        }
      />
    </FullPageView>
  );
}

export { NotFoundPage };
