import { useTranslations } from 'next-intl';

import { MASCOT_POSE } from '@/constants/mascot';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/shared/components/EmptyState';
import { FullPageView } from '@/shared/components/FullPageView';
import { Mascot } from '@/shared/components/Mascot';
import { Button } from '@/shared/components/ui/button';

/**
 * What `forbidden()` renders — a signed-in User whose Role does not reach the
 * surface. It ships ahead of its first caller: no frontend page guards on Role
 * yet, and a boundary added with that page would be one more thing to remember.
 */
function ForbiddenPage() {
  const t = useTranslations('forbiddenPage');
  const common = useTranslations('common');

  return (
    <FullPageView>
      <EmptyState
        illustration={<Mascot pose={MASCOT_POSE.DENIED} />}
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

export { ForbiddenPage };
