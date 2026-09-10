'use client';

import { ACTION_ERROR, type ActionErrorCode, UNPLACED_ACTION_ERRORS } from '@/constants/action';
import { TOAST_SCOPE, type ToastMessageKey, type ToastScope } from '@/constants/toast';
import { raiseActionErrorToast, raiseSuccessToast } from '@/shared/components/Toaster/raiseToast';
import { type ActionResult, actionFailure, isActionSuccess } from '@/shared/lib/actionResult';

/** Everything one call says about the toast, and the only place it is configured. */
interface ActionToastOptions {
  /** Which failure codes reach the toast — `UNPLACED` by default (`src/constants/toast.ts`). */
  scope?: ToastScope;

  /** Set `false` to keep the reason without the toast. `true` by default. */
  isEnabled?: boolean;

  /** The `toast` copy key confirming a success. A write naming none confirms nothing. */
  successMessage?: ToastMessageKey;
}

/** What one call may say about itself, beyond the write it is given. */
interface RunActionOptions {
  /** What this call lets the toast say. */
  toast?: ActionToastOptions;

  /** Nothing is recorded and nothing is said — pattern A. Beats every toast option. */
  isSilent?: boolean;

  /** Named in the log line when the write throws — a store key, an action name. */
  name?: string;
}

async function resolveWriteResult<TData, TCode extends string>(
  write: () => Promise<ActionResult<TData, TCode>>,
  name: string | undefined,
): Promise<ActionResult<TData, TCode | ActionErrorCode>> {
  try {
    return await write();
  } catch (error) {
    // Reaching here is the transport or a defect, and both settle as `UNEXPECTED` —
    // which tells them apart for nobody, so the original is logged.
    console.error({ name, err: error }, 'A write threw instead of answering');

    return actionFailure(ACTION_ERROR.UNEXPECTED);
  }
}

/**
 * Speaks one failure code, or does not, under the rules a call declared. Its own
 * function because two sites decide this: every answered call through `runAction`,
 * and the deadline `runOptimistic` gives up on, which nothing is awaiting.
 */
function raiseFailure(code: string, options: RunActionOptions = {}): void {
  const { toast = {}, isSilent } = options;
  const { scope = TOAST_SCOPE.UNPLACED, isEnabled = true } = toast;

  if (isSilent || !isEnabled || scope === TOAST_SCOPE.NONE) {
    return;
  }

  const isDrawnElsewhere =
    scope === TOAST_SCOPE.UNPLACED && !UNPLACED_ACTION_ERRORS.some((each) => each === code);

  if (isDrawnElsewhere) {
    return;
  }

  raiseActionErrorToast(code);
}

/**
 * **The only way a client calls a Server Action.** It awaits the answer, turns a
 * throw into `ACTION_ERROR.UNEXPECTED` with the original logged, and raises the
 * toast the options ask for. The result is returned either way.
 *
 * **Two of these nest** wherever a form's write is an optimistic one; both take
 * `NONE`, and the toast id is the code, so one sentence reaches the screen at most
 * (`docs/features/data-access/api-local.md`).
 */
async function runAction<TData, TCode extends string = ActionErrorCode>(
  write: () => Promise<ActionResult<TData, TCode>>,
  options: RunActionOptions = {},
): Promise<ActionResult<TData, TCode | ActionErrorCode>> {
  const { toast = {}, isSilent, name } = options;
  const result = await resolveWriteResult(write, name);

  if (isActionSuccess(result)) {
    if (toast.successMessage && !isSilent && toast.isEnabled !== false) {
      raiseSuccessToast(toast.successMessage);
    }

    return result;
  }

  raiseFailure(result.error.code, options);

  return result;
}

export type { ActionToastOptions, RunActionOptions };
export { raiseFailure, runAction };
