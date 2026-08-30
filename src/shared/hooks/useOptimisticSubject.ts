'use client';

import { useEffect } from 'react';

import { useOptimisticEntry } from '@/shared/hooks/useOptimisticEntry';
import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';
import type { ActionResult } from '@/shared/lib/actionResult';
import type { OptimisticDescriptor } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticEntry, OptimisticPatch } from '@/shared/lib/optimistic/entry';
import { runOptimistic } from '@/shared/lib/optimistic/run';
import { writtenFields } from '@/shared/lib/optimistic/transitions';

/** What every optimistic hook is given: an action, the row it addresses, and that row's version. */
interface UseOptimisticSubjectOptions<TInput, TData> {
  /** The write this subject is under — where its key, its action and its value mapping come from. */
  descriptor: OptimisticDescriptor<TInput, TData>;

  /**
   * What identifies the record being written. The key is built from it, by the
   * descriptor. `NoInfer` so the descriptor alone decides what the input is: a
   * call site passing the id and nothing else would otherwise narrow the shape
   * to that, and no field of the record would be nameable.
   */
  input: NoInfer<TInput>;

  /** The server's `updatedAt` for that record. What decides when the overlay is superseded. */
  version?: string | null;
}

/** What a refused write leaves behind. See `UseOptimisticValueOptions.onFailure`. */
type OptimisticFailureMode = 'keep' | 'rollback' | 'silent';

/** The key, its entry and the two verbs — everything a reading hook shapes into props. */
interface OptimisticSubject<TData> {
  key: string;
  entry: OptimisticEntry | null;

  /** The version the render was built from, normalized so `undefined` and `null` are one case. */
  sourceVersion: string | null;

  /** Sends the named fields and shows them at once. Only those fields are this write's to settle. */
  write: (
    patch: OptimisticPatch,
    onFailure?: OptimisticFailureMode,
  ) => Promise<ActionResult<TData>>;

  /** Throws one field's attempt away, or the whole record's when given nothing. */
  dismiss: (field?: string) => void;
}

/**
 * The half of an optimistic hook that is the same whether a surface owns one
 * field or a whole record: subscribe to the key, retire an overlay the server has
 * caught up with, and write through the descriptor. What differs is only how the
 * entry is read, which is each hook's own business.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useOptimisticSubject<TInput, TData>({
  descriptor,
  input,
  version,
}: UseOptimisticSubjectOptions<TInput, TData>): OptimisticSubject<TData> {
  // Defaulted here rather than in the parameter list: the React Compiler cannot
  // lower a destructured default and skips the whole hook when it meets one.
  const sourceVersion = version ?? null;
  const key = descriptor.key(input);
  const store = useOptimisticStore();
  const entry = useOptimisticEntry(key);

  // The render is the only place the server's version is known, and an entry the
  // render has caught up with has nothing left to add.
  useEffect(() => {
    store.reconcile(key, sourceVersion);
  }, [store, key, sourceVersion]);

  return {
    key,
    entry,
    sourceVersion,
    write(patch, onFailure = 'keep') {
      const fields = writtenFields(undefined, patch);

      return runOptimistic(descriptor, Object.assign({}, input, patch), {
        optimisticData: patch,
        fields,
        sourceVersion,
        store,
        // `keep` leaves the refused value on screen with the reason beside it;
        // the other two hand the named fields back to the server.
        rollback: onFailure === 'keep' ? undefined : fields,
        isSilent: onFailure === 'silent',
      });
    },
    dismiss: (field) => store.dismiss(key, field),
  };
}

export type { OptimisticFailureMode, OptimisticSubject, UseOptimisticSubjectOptions };
export { useOptimisticSubject };
