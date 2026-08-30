import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_ERROR, OPTIMISTIC_REQUEST_TIMEOUT_MS } from '@/constants/optimistic';
import { type ActionResult, actionFailure, isActionSuccess } from '@/shared/lib/actionResult';
import type { OptimisticDescriptor } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticPatch } from '@/shared/lib/optimistic/entry';
import { type OptimisticStore, optimisticStore } from '@/shared/lib/optimistic/store';
import { writtenFields } from '@/shared/lib/optimistic/transitions';

/** The slots one call may carry, beyond what the descriptor already answers for. */
interface RunOptimisticOptions {
  /** The changed fields to show at once. */
  optimisticData?: OptimisticPatch;

  /** Which fields this write owns. Defaults to the keys of `optimisticData`. */
  fields?: readonly string[];

  /** The `updatedAt` the write was computed from, which dates the entry. */
  sourceVersion?: string | null;

  /** Written on top of the server's answer, so a hand-written value beats it. */
  successData?: OptimisticPatch;

  /** Carrying the previous value here is what a rollback is — there is no automatic one. */
  failureData?: OptimisticPatch;

  /** Fields a failure hands back to the server, by dropping them from the patch. */
  rollback?: readonly string[];

  /** Records no reason for a failure. What makes a write silent (pattern A). */
  isSilent?: boolean;

  /** Written last on both paths, whatever the answer was. */
  finallyData?: OptimisticPatch;

  /** The store to write to. The app's singleton unless a test injects its own. */
  store?: OptimisticStore;

  /** How long to wait before the interface gives up on the answer. */
  timeoutMs?: number;
}

/**
 * Runs one action through the store: open the write on the descriptor's key,
 * await the answer, settle it under the call number that opened it. The answer is
 * returned as well, so a caller that needs the payload can await it.
 *
 * No React in here — the hooks are the binding, this is the rule
 * (docs/features/data-access/optimistic-hooks.md).
 */
async function runOptimistic<TInput, TData>(
  descriptor: OptimisticDescriptor<TInput, TData>,
  input: TInput,
  options: RunOptimisticOptions = {},
): Promise<ActionResult<TData>> {
  const {
    optimisticData,
    // `claimed` because the line below turns it into the fields this call owns,
    // and both are in scope for the rest of the function.
    fields: claimed,
    sourceVersion,
    successData,
    failureData,
    rollback,
    isSilent,
    finallyData,
    store = optimisticStore,
    timeoutMs = OPTIMISTIC_REQUEST_TIMEOUT_MS,
  } = options;

  const key = descriptor.key(input);
  // What this call claims, and so the most its answer may retire. What is still
  // *left* of that claim by the time the answer lands is the store's to decide —
  // a newer write may have taken a field over in the meantime.
  const fields = writtenFields(claimed, optimisticData);
  const call = store.begin(key, {
    action: descriptor.pending,
    optimisticData,
    fields: claimed,
    sourceVersion,
  });

  // The request is never cancelled — a Server Action cannot be — so this timer
  // only stops the interface from waiting on an answer nobody is sending. A late
  // answer still carries this call number and settles on top of the failure.
  const deadlineTimer = setTimeout(() => {
    store.settleFailure(key, call, {
      error: { code: OPTIMISTIC_ERROR.TIMED_OUT },
      fields,
      rollback,
      isSilent,
    });
  }, timeoutMs);

  let result: ActionResult<TData>;

  try {
    result = await descriptor.run(input);
  } catch (error) {
    // An action answers with its failures, so reaching here is the transport
    // breaking or a defect in our own client code. Both settle as `UNEXPECTED`,
    // which tells them apart for nobody — so the original is logged, or the only
    // trace of a client-side bug is a generic sentence a User reads.
    console.error({ key, err: error }, 'An optimistic write threw instead of answering');

    result = actionFailure(ACTION_ERROR.UNEXPECTED);
  } finally {
    clearTimeout(deadlineTimer);
  }

  if (isActionSuccess(result)) {
    store.settleSuccess(key, call, {
      serverData: descriptor.value?.(result.data),
      serverVersion: descriptor.version?.(result.data),
      fields,
      successData,
      finallyData,
    });
  } else {
    store.settleFailure(key, call, {
      error: result.error,
      fields,
      failureData,
      rollback,
      isSilent,
      finallyData,
    });
  }

  return result;
}

export type { RunOptimisticOptions };
export { runOptimistic };
