'use client';

import { WifiOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useIsOffline } from '@/shared/hooks/useIsOffline';
import { cn } from '@/shared/lib/cn';

interface OfflineIndicatorProps {
  /** Additional classes, merged onto the root element. */
  className?: string;
}

// `sr-only` alone loses to the primitive's own box (`relative w-full px-4 py-3
// border`) — same element, later in the cascade — so the box is merged away too.
const SILENT = 'sr-only absolute w-px border-0 p-0';

// Failure as ink is `--status-failed`, not `text-destructive`: the destructive
// fill reads 2.2:1 on dark-fantasy's raised surface (`shadcn-adapter.css`).
const SPEAKING = 'border-status-failed font-meta text-status-failed text-xs tracking-meta';

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
    <Alert className={cn(isOffline ? SPEAKING : SILENT, className)} role="status">
      {isOffline ? <WifiOffIcon aria-hidden="true" /> : null}
      <AlertDescription className="text-current">
        {isOffline ? t('offline') : null}
      </AlertDescription>
    </Alert>
  );
}

export type { OfflineIndicatorProps };
export { OfflineIndicator };
