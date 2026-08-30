'use client';

import { useEffect, useState } from 'react';

import type { ActionStatus } from '@/constants/action';
import { isPending } from '@/shared/lib/actionStatus';

/**
 * How the last write that finished ended, while the next one is still out. What a
 * surface needs to tell a first attempt from a retry: flight says nothing about
 * whether there was a problem before it.
 *
 * The previous render's status cannot answer that — a write in flight over
 * several renders answers "pending" from the second one on, and whatever it was
 * retrying is already forgotten.
 */
function useLastSettledStatus(status: ActionStatus): ActionStatus {
  const [settled, setSettled] = useState(status);

  useEffect(() => {
    if (!isPending(status)) {
      setSettled(status);
    }
  }, [status]);

  return isPending(status) ? settled : status;
}

export { useLastSettledStatus };
