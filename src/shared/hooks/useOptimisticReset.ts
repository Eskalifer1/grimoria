'use client';

import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';

/**
 * Wipes every overlay, and the seam a screen resets through, since a screen never
 * names the store. Synchronous: the wipe has to be done before the next render,
 * not after an await.
 *
 * **Nothing calls this yet.** The document is one slot for the whole browser and
 * carries no User on it, so until the sign-in and the sign-out screens land and
 * call this (#1), a failure one User walked away from renders to the next one on
 * the same machine.
 */
function useOptimisticReset(): () => void {
  return useOptimisticStore().clearAll;
}

export { useOptimisticReset };
