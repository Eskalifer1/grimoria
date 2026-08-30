'use client';

import { useTranslations } from 'next-intl';

import { ACTION_STATUS, type ActionStatus } from '@/constants/action';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { isFailure, isPending } from '@/shared/lib/actionStatus';
import { cn } from '@/shared/lib/cn';

/** One token per status, so the marker carries the same meaning in both Themes. */
const TONE: Record<ActionStatus, string> = {
  [ACTION_STATUS.IDLE]: 'bg-status-idle',
  [ACTION_STATUS.PENDING]: 'bg-status-live',
  [ACTION_STATUS.SUCCESS]: 'bg-status-done',
  [ACTION_STATUS.FAILURE]: 'bg-status-failed',
};

interface StatusDotProps {
  /** Where the write stands. Flight is drawn only once it outlasts the threshold. */
  status: ActionStatus;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The marker for a surface with no room for a sentence. A failure is the only
 * status it says out loud — announcing every success is noise.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function StatusDot({ status, className }: StatusDotProps) {
  const t = useTranslations('optimistic');
  const isSlow = usePendingDelay(isPending(status));
  const shown = isPending(status) && !isSlow ? ACTION_STATUS.IDLE : status;

  return (
    <span aria-busy={isSlow || undefined} className={cn('inline-flex items-center', className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-pill', TONE[shown])} />
      {/* Mounted always, filled only on a failure (`accessibility.md`). */}
      <span className="sr-only" role="alert">
        {isFailure(shown) ? t('problem') : null}
      </span>
    </span>
  );
}

export type { StatusDotProps };
export { StatusDot };
