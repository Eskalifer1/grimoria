'use client';

import { useEffect } from 'react';

import type { PendingAction } from '@/constants/optimistic';
import { useOptimisticEntry } from '@/shared/hooks/useOptimisticEntry';
import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';
import { patchField } from '@/shared/lib/optimistic/descriptor';
import { fieldPending } from '@/shared/lib/optimistic/read';

interface UseOptimisticReadOptions<TValue> {
  /** The record's key, from the builder in `src/constants/cacheTags.ts` — never typed. */
  key: string;

  /** The field to read out of the patch. */
  field: string;

  /** The server-confirmed value, re-read on every render. */
  value: TValue;

  /** The server's `updatedAt` for that value. What decides when the overlay is superseded. */
  version?: string | null;
}

interface UseOptimisticReadResult<TValue> {
  /** What to render: the store's value while it holds one, the server's otherwise. */
  value: TValue;

  /** Which kind of write is out against this field, and `null` when none is. */
  pendingAction: PendingAction | null;

  /** Whether a write is out against this field. */
  isPending: boolean;
}

/**
 * One field, read only: the value and whether a write is out against it, never
 * the failure — the surface that owns the write says that. No descriptor, so a
 * Server Component can hand it everything it needs. Reconciles like the writing
 * hooks do: a mirror is often the first render after the write, and the overlay
 * has to die there too.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useOptimisticRead<TValue>({
  key,
  field,
  value,
  version,
}: UseOptimisticReadOptions<TValue>): UseOptimisticReadResult<TValue> {
  const store = useOptimisticStore();
  const entry = useOptimisticEntry(key);
  const sourceVersion = version ?? null;
  const pendingAction = fieldPending(entry, field);

  useEffect(() => {
    store.reconcile(key, sourceVersion);
  }, [store, key, sourceVersion]);

  return {
    value: patchField(entry?.patch, field, value),
    pendingAction,
    isPending: !!pendingAction,
  };
}

export type { UseOptimisticReadOptions, UseOptimisticReadResult };
export { useOptimisticRead };
