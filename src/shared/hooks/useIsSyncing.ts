'use client';

import { useOptimisticSnapshot } from '@/shared/hooks/useOptimisticEntry';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { hasPendingEntry } from '@/shared/lib/optimistic/entries';

/**
 * Whether anything at all is in flight, past the threshold that keeps a fast
 * answer from flashing. The whole store rather than one key: this is what a
 * global indicator reads, and it has no key to name.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function useIsSyncing(): boolean {
  const isPending = hasPendingEntry(useOptimisticSnapshot());

  return usePendingDelay(isPending);
}

export { useIsSyncing };
