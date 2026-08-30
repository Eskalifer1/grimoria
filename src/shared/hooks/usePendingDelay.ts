'use client';

import { useEffect, useState } from 'react';

import { OPTIMISTIC_PENDING_DELAY_MS } from '@/constants/optimistic';

/**
 * Whether a write has run long enough to be worth drawing. A write that answers
 * in 80 ms shows nothing at all, because a spinner that appears and vanishes
 * reads as a glitch rather than as progress. Owned here so no surface writes its
 * own threshold — errors are never delayed, only flight.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function usePendingDelay(isPending: boolean): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setIsSlow(false);

      return;
    }

    const timer = setTimeout(() => setIsSlow(true), OPTIMISTIC_PENDING_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isPending]);

  return isPending && isSlow;
}

export { usePendingDelay };
