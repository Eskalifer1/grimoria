'use client';

import type { ReactNode } from 'react';

import { PENDING_ACTION, type PendingAction } from '@/constants/optimistic';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { cn } from '@/shared/lib/cn';

interface InFlightProps {
  /** Which kind of write is out against what is inside, and `null` when none is. */
  pendingAction: PendingAction | null;

  /** Dim regardless of flight — a draft the server refused, which it does not hold. */
  isUnconfirmed?: boolean;

  /** The element drawn: inline text or a block of it. */
  as?: 'span' | 'div';

  /** What is in flight. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * How a value looks while its write is out: 70% after the pending delay (60%
 * fell under 4.5:1 on the card in `standard`), struck through when the write is
 * a delete, `aria-busy` for the duration. Never disabled, never a message —
 * `docs/features/data-access/pattern-b.md` §Dimming.
 */
function InFlight({
  pendingAction,
  isUnconfirmed,
  as: Tag = 'span',
  children,
  className,
}: InFlightProps) {
  const isSlow = usePendingDelay(!!pendingAction);

  return (
    <Tag
      aria-busy={isSlow || undefined}
      className={cn(
        'transition-opacity',
        (isSlow || isUnconfirmed) && 'opacity-70',
        isSlow && pendingAction === PENDING_ACTION.DELETE && 'line-through',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export type { InFlightProps };
export { InFlight };
