'use client';

import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useIsOffline } from '@/shared/hooks/useIsOffline';
import { cn } from '@/shared/lib/cn';

interface OfflineIndicatorProps {
  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * Signage, and only signage. Nothing here queues, retries or disables: a write
 * made offline still goes out and still fails (ADR-0012).
 *
 * `role="status"`, not the primitive's `role="alert"` — losing a connection is
 * not an emergency worth cutting a screen reader off for.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const t = useTranslations('optimistic');
  const isOffline = useIsOffline();

  return (
    <Alert
      className={cn(isOffline ? 'font-meta text-xs' : 'sr-only', className)}
      role="status"
      variant={isOffline ? 'destructive' : 'default'}
    >
      <AlertDescription>{isOffline ? t('offline') : null}</AlertDescription>
    </Alert>
  );
}

export type { OfflineIndicatorProps };
export { OfflineIndicator };
