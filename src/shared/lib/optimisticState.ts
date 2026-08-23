import {
  ACTION_STATUS,
  type ActionErrorCode,
  type ActionStatus,
  FAILURE_BEHAVIOR,
  type FailureBehavior,
} from '@/constants/action';
import {
  type ActionFailureDetail,
  type ActionResult,
  isActionSuccess,
} from '@/shared/lib/actionResult';

/**
 * What an optimistic surface shows and why. `error` is non-null exactly when
 * `status` is `FAILURE`, which is what keeps "failed but no reason" and
 * "succeeded with a reason" out of the type.
 */
interface OptimisticState<TValue, TCode extends string = ActionErrorCode> {
  /** The value to render — optimistic while pending, settled after. */
  value: TValue;

  /** Where the write stands. */
  status: ActionStatus;

  /** Why the last write failed, cleared by the next attempt or by a dismissal. */
  error: ActionFailureDetail<TCode> | null;
}

/** The inputs the settled half needs, all of them known before the action is awaited except `result`. */
interface SettleOptimisticInput<TValue, TCode extends string> {
  /** The server-confirmed value a rollback returns to. */
  previous: TValue;

  /** The value shown while the action was in flight. */
  optimistic: TValue;

  /** What the action answered. */
  result: ActionResult<unknown, TCode>;

  /** What a failure does with `optimistic`. */
  failureBehavior: FailureBehavior;

  /**
   * The value the server confirmed, wrapped. Absent, `optimistic` stands.
   *
   * Wrapped rather than bare so a `TValue` that includes `null` — an avatar
   * cleared, a due date removed — can carry a confirmed `null` without it
   * reading as "the caller mapped nothing".
   */
  successValue?: { value: TValue };
}

/**
 * The pending half of the transition, shaped as a `useOptimistic` reducer: show
 * the new value at once and drop the error an earlier attempt left, so a retry
 * starts clean.
 */
function startOptimistic<TValue, TCode extends string = ActionErrorCode>(
  _state: OptimisticState<TValue, TCode>,
  optimistic: TValue,
): OptimisticState<TValue, TCode> {
  return { value: optimistic, status: ACTION_STATUS.PENDING, error: null };
}

/**
 * The settled half: `PENDING -> SUCCESS | FAILURE`. A success keeps the optimistic
 * value unless `successValue` carries the server's, a failure rolls back to
 * `previous` or keeps the optimistic value per `failureBehavior`, and carries the
 * failure detail either way.
 *
 * Pure, so the whole rule is testable without a DOM
 * (docs/features/data-access.md → Rollback versus keep).
 */
function settleOptimistic<TValue, TCode extends string = ActionErrorCode>({
  previous,
  optimistic,
  result,
  failureBehavior,
  successValue,
}: SettleOptimisticInput<TValue, TCode>): OptimisticState<TValue, TCode> {
  if (isActionSuccess(result)) {
    return {
      value: successValue === undefined ? optimistic : successValue.value,
      status: ACTION_STATUS.SUCCESS,
      error: null,
    };
  }

  return {
    value: failureBehavior === FAILURE_BEHAVIOR.ROLLBACK ? previous : optimistic,
    status: ACTION_STATUS.FAILURE,
    error: result.error,
  };
}

/** The state a surface starts in, and the one a dismissal returns it to. */
function idleOptimistic<TValue, TCode extends string = ActionErrorCode>(
  value: TValue,
): OptimisticState<TValue, TCode> {
  return { value, status: ACTION_STATUS.IDLE, error: null };
}

export type { OptimisticState, SettleOptimisticInput };
export { idleOptimistic, settleOptimistic, startOptimistic };
