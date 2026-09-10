import { OPTIMISTIC_ERROR, OPTIMISTIC_REQUEST_TIMEOUT_MS } from '@/constants/optimistic';
import { TOAST_SCOPE } from '@/constants/toast';
import {
  type ActionToastOptions,
  type RunActionOptions,
  raiseFailure,
  runAction,
} from '@/shared/lib/action/runAction';
import { type ActionResult, isActionSuccess } from '@/shared/lib/actionResult';
import type { OptimisticDescriptor } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticPatch } from '@/shared/lib/optimistic/entry';
import { type OptimisticStore, optimisticStore } from '@/shared/lib/optimistic/store';
import { writtenFields } from '@/shared/lib/optimistic/transitions';

/** Everything one call writes to the store, at each of the three moments it writes. */
interface OptimisticWriteData {
  /** The changed fields to show at once, before the server has answered. */
  optimisticPatch?: OptimisticPatch;

  /** Which fields this write owns. Defaults to the keys of `optimisticPatch`. */
  claimedFields?: readonly string[];

  /** The `updatedAt` the write was computed from, which dates the entry. */
  sourceVersion?: string | null;

  /** Written on top of the server's answer, so a hand-written value beats it. */
  successPatch?: OptimisticPatch;

  /** Carrying the previous value here is what a rollback is — there is no automatic one. */
  failurePatch?: OptimisticPatch;

  /** Fields a failure hands back to the server, by dropping them from the patch. */
  rolledBackFields?: readonly string[];

  /** Written last on both paths, whatever the answer was. */
  settledPatch?: OptimisticPatch;
}

/** The slots one call may carry, beyond what the descriptor already answers for. */
interface RunOptimisticOptions {
  /** What this write puts in the store, and when. */
  data?: OptimisticWriteData;

  /**
   * What this write lets the toast say. **`scope` is `NONE` by default** here: the
   * store records every failure and the surface draws it, so a toast would state
   * it twice. A write whose surface may be gone when the answer lands passes `ALL`.
   */
  toast?: ActionToastOptions;

  /** Records no reason for a failure, and raises no toast. What makes a write silent (pattern A). */
  isSilent?: boolean;

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
    data = {},
    toast,
    isSilent,
    store = optimisticStore,
    timeoutMs = OPTIMISTIC_REQUEST_TIMEOUT_MS,
  } = options;
  const {
    optimisticPatch,
    claimedFields,
    sourceVersion,
    successPatch,
    failurePatch,
    rolledBackFields,
    settledPatch,
  } = data;

  const key = descriptor.key(input);
  // What this call claims, and so the most its answer may retire. What is still
  // *left* of that claim when the answer lands is the store's to decide — a newer
  // write may have taken a field over in the meantime.
  const ownedFields = writtenFields(claimedFields, optimisticPatch);
  const call = store.begin(key, {
    action: descriptor.pending,
    optimisticData: optimisticPatch,
    fields: claimedFields,
    sourceVersion,
  });

  // Spread over `NONE`, so a caller that names no scope stays quiet: the store
  // records every failure and the surface draws it (`docs/features/forms.md`).
  const actionOptions: RunActionOptions = {
    toast: { scope: TOAST_SCOPE.NONE, ...toast },
    isSilent,
    name: key,
  };

  // The request is never cancelled — a Server Action cannot be — so this timer
  // only stops the interface from waiting on an answer nobody is sending. A late
  // answer still carries this call number and settles on top of the failure.
  const deadlineTimer = setTimeout(() => {
    store.settleFailure(key, call, {
      error: { code: OPTIMISTIC_ERROR.TIMED_OUT },
      fields: ownedFields,
      rollback: rolledBackFields,
      isSilent,
    });

    // The one failure nothing is awaiting, so `runAction` never reaches it — a
    // caller that took `ALL` has to hear this one too.
    raiseFailure(OPTIMISTIC_ERROR.TIMED_OUT, actionOptions);
  }, timeoutMs);

  // Cleared through `finally` rather than after the call: the timer outlives a
  // throw, and a leaked one settles `timedOut` over a call that already answered.
  const result = await runAction(() => descriptor.run(input), actionOptions).finally(() => {
    clearTimeout(deadlineTimer);
  });

  if (isActionSuccess(result)) {
    store.settleSuccess(key, call, {
      serverData: descriptor.value?.(result.data),
      serverVersion: descriptor.version?.(result.data),
      fields: ownedFields,
      successData: successPatch,
      finallyData: settledPatch,
    });
  } else {
    store.settleFailure(key, call, {
      error: result.error,
      fields: ownedFields,
      failureData: failurePatch,
      rollback: rolledBackFields,
      isSilent,
      finallyData: settledPatch,
    });
  }

  return result;
}

export type { OptimisticWriteData, RunOptimisticOptions };
export { runOptimistic };
