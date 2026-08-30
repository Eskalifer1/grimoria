'use client';

import { type ReactNode, useRef } from 'react';

import { PENDING_ACTION, type PendingAction } from '@/constants/optimistic';
import { ErrorRow } from '@/shared/components/ErrorRow';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { cn } from '@/shared/lib/cn';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';

interface OptimisticRowProps {
  /** Which kind of write is in flight against this row, and `null` when none is. */
  pendingAction: PendingAction | null;

  /** Why the row's last write failed, and `null` when nothing did. */
  error: OptimisticFailure | null;

  /** Whether the server has not confirmed this row exists — a failed insert stays dim, because of this. */
  isDraft?: boolean;

  /** Throws the attempt away — the message and the value it belongs to. Omitted where nothing may be. */
  onDismiss?: () => void;

  /** The content to render inside the row. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * A row of a list under pattern B: dimmed while a write is slow, struck through
 * while a removal is, and **never leaving its position** — a row that vanishes
 * and comes back on failure is worse than one that waits. Nothing is disabled.
 *
 * The dimming stops at the row's content: the message measured 3.04:1 dimmed,
 * under the 4.5:1 `accessibility.md` holds.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function OptimisticRow({
  pendingAction,
  error,
  isDraft,
  onDismiss,
  children,
  className,
}: OptimisticRowProps) {
  const isSlow = usePendingDelay(!!pendingAction);
  const isUnconfirmed = !!isDraft && !!error;
  // Where focus lands after a dismissal: the row outlives the button that held it.
  const row = useRef<HTMLLIElement>(null);

  return (
    <li
      aria-busy={isSlow || undefined}
      ref={row}
      tabIndex={-1}
      className={cn('flex min-w-0 flex-col gap-1', className)}
    >
      <div
        className={cn(
          'min-w-0 transition-opacity',
          (isSlow || isUnconfirmed) && 'opacity-70',
          isSlow && pendingAction === PENDING_ACTION.DELETE && 'line-through',
        )}
      >
        {children}
      </div>
      {/* No room held for a message that has not arrived: a held line under every
          row of every list is paid for a failure that is rare. */}
      <div className="flex flex-col font-meta text-xs">
        <ErrorRow errors={error ? [error] : []} onDismiss={onDismiss} returnFocusTo={row} />
      </div>
    </li>
  );
}

export type { OptimisticRowProps };
export { OptimisticRow };
