'use client';

import { useTranslations } from 'next-intl';

import { MASCOT_POSE } from '@/constants/mascot';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/shared/components/EmptyState';
import { FullPageView } from '@/shared/components/FullPageView';
import { Mascot } from '@/shared/components/Mascot';
import { Button } from '@/shared/components/ui/button';

interface ErrorBoundaryProps {
  /** The uncaught error. Only its `digest` is ever shown — see below. */
  error: Error & { digest?: string };

  /** Re-renders the segment. Handed to the retry, which is why this is a client file. */
  reset: () => void;
}

/**
 * Every uncaught throw under `[locale]`. `error.message` is never rendered: Next
 * replaces it with a placeholder in production, so showing it would make dev and
 * prod two different screens — and a Payload or Postgres message leaks schema.
 */
function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('errorBoundary');
  const common = useTranslations('common');

  return (
    <FullPageView>
      <EmptyState
        illustration={<Mascot pose={MASCOT_POSE.SAD} />}
        heading="h1"
        title={t('title')}
        description={t('description')}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>{t('retry')}</Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.HOME}>{common('backHome')}</Link>
            </Button>
          </div>
        }
        reference={error.digest ? t('reference', { digest: error.digest }) : null}
      />
    </FullPageView>
  );
}

export default ErrorBoundary;
