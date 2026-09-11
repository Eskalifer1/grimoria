import { useTranslations } from 'next-intl';

import { MASCOT_POSE } from '@/constants/mascot';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/shared/components/EmptyState';
import { FullPageView } from '@/shared/components/FullPageView';
import { Mascot } from '@/shared/components/Mascot';
import { Button } from '@/shared/components/ui/button';

/**
 * What a signed-out visitor gets from `unauthorized()`. The action is the way
 * home rather than a sign-in link until there is a sign-in route to point at
 * (#1).
 */
function UnauthorizedPage() {
  const t = useTranslations('unauthorizedPage');
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

export { UnauthorizedPage };
