'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { ACTION_ERROR, type ActionStatus } from '@/constants/action';
import { EmptyState } from '@/shared/components/EmptyState';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { useLastSettledStatus } from '@/shared/hooks/useLastSettledStatus';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { isFailure, isPending } from '@/shared/lib/actionStatus';
import { cn } from '@/shared/lib/cn';
import { clientFailure, type OptimisticFailure } from '@/shared/lib/optimistic/entry';

/** Surface and block share one cell, so taking over does not move what is below. */
const LAYER = 'col-start-1 row-start-1';

/** Keeps the space and gives up the tab order and the accessibility tree. */
const HIDDEN = 'invisible';

/** What blocks a surface that failed without saying why. */
const UNEXPLAINED = clientFailure(ACTION_ERROR.UNEXPECTED);

interface BlockingViewProps {
  /** Where the surface stands. Only flight past the threshold and a failure replace it. */
  status: ActionStatus;

  /** Why the surface is blocked. An unexplained failure still blocks, worded generically. */
  error?: OptimisticFailure | null;

  /** A retry or a way out, rendered under the message. Omitted where there is nothing to offer. */
  action?: ReactNode;

  /** The content to render inside the surface, whenever nothing is blocking it. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The last resort (pattern D): the surface itself replaced, because there is
 * nothing partial worth showing.
 *
 * Surface and block share one grid cell, so taking over does not move what is
 * below. The hidden surface keeps its space and is `inert`, so it holds it
 * without being reachable.
 *
 * See docs/features/data-access/pattern-d.md.
 */
function BlockingView({ status, error, action, children, className }: BlockingViewProps) {
  const t = useTranslations('optimistic');
  const errorMessage = useActionErrorMessage();
  const isSlow = usePendingDelay(isPending(status));
  const settled = useLastSettledStatus(status);
  const isFailed = isFailure(status);

  // A retry from an already-blocked surface waits for nothing: handed the old
  // value back for the threshold's 200 ms, it flashes up and is taken away again.
  const isRetry = isPending(status) && isFailure(settled);
  const isBlocked = isFailed || isSlow || isRetry;
  const isWaiting = isPending(status) && isBlocked;
  const reason = isFailed ? errorMessage(error ?? UNEXPLAINED) : null;

  return (
    <div className={cn('grid', className)}>
      <span className="sr-only" role="status">
        {reason ?? (isWaiting ? t('pending') : null)}
      </span>
      <div className={cn(LAYER, isBlocked && HIDDEN)} inert={isBlocked}>
        {children}
      </div>
      <EmptyState
        aria-busy={isWaiting || undefined}
        className={cn(LAYER, !isBlocked && HIDDEN)}
        title={isFailed ? t('problem') : t('pending')}
        description={reason ?? undefined}
        tone={isFailed ? 'failed' : 'neutral'}
        action={isFailed ? action : null}
      />
    </div>
  );
}

export type { BlockingViewProps };
export { BlockingView };
