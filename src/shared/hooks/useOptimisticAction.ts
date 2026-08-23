'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';

import {
  ACTION_ERROR,
  ACTION_STATUS,
  type ActionErrorCode,
  type ActionStatus,
  type FailureBehavior,
} from '@/constants/action';
import {
  type ActionFailureDetail,
  type ActionResult,
  actionFailure,
} from '@/shared/lib/actionResult';
import {
  idleOptimistic,
  type OptimisticState,
  settleOptimistic,
  startOptimistic,
} from '@/shared/lib/optimisticState';

/** What `run` may override for one call, where the server's answer decides the value. */
interface RunOptions<TData, TValue> {
  /** Maps the success payload to what should stay on screen. Omitted, the optimistic value stays. */
  successValue?: (data: TData) => TValue;
}

/** A settled outcome and the `value` it was computed against, which is what dates it. */
interface SettledSnapshot<TValue, TCode extends string> {
  /** What the call settled into — the value to keep showing, and any failure. */
  state: OptimisticState<TValue, TCode>;

  /** The `value` prop at the time the call was made. A different prop supersedes the snapshot. */
  source: TValue;
}

interface UseOptimisticActionOptions<TValue> {
  /**
   * The server-resolved value, re-read on every render. It is the truth a
   * rollback lands on, so it must come from props or a Server Component, never
   * from state this hook owns.
   */
  value: TValue;

  /** What a failure does with the optimistic value — an edit rolls back, a create keeps it. */
  failureBehavior: FailureBehavior;

  /**
   * Whether two `value` props are the same server truth, deciding when an
   * optimistic value stops standing in for it. Defaults to `Object.is`, which is
   * what a primitive needs.
   *
   * A `TValue` rebuilt on every render — a list, an object — compares unequal to
   * itself and would drop what the User typed one render after a `KEEP` failure,
   * so it passes its own comparison. **Compare over something that moves when
   * the server value moves** — a version, an `updatedAt`. Comparing over an id
   * says "same row", not "same truth", and pins the value the write started from
   * on screen for as long as the row keeps its id.
   */
  isSameValue?: (previous: TValue, next: TValue) => boolean;
}

interface UseOptimisticActionResult<TValue, TCode extends string = ActionErrorCode> {
  /** What to render: the optimistic value while in flight, the settled one after. */
  value: TValue;

  /** Where the last call stands — `IDLE`, `PENDING`, `SUCCESS` or `FAILURE`. */
  status: ActionStatus;

  /** Why the last call failed, or `null`. Non-null exactly while `status` is `FAILURE`. */
  error: ActionFailureDetail<TCode | ActionErrorCode> | null;

  /** Whether a call is in flight. The value to disable a submit on. */
  isPending: boolean;

  /**
   * Shows `optimistic`, runs `action`, then settles. Resolves with the action's
   * own result, so a caller that needs the payload can await it; ignoring the
   * promise is safe and is the common case.
   */
  run: <TData>(
    optimistic: TValue,
    action: () => Promise<ActionResult<TData, TCode>>,
    options?: RunOptions<TData, TValue>,
  ) => Promise<ActionResult<TData, TCode | ActionErrorCode>>;

  /** Clears a settled failure or success — the dismiss button, or a form reset. */
  reset: () => void;
}

/**
 * Runs a Server Action while the UI already shows the value it will produce
 * (pattern A and B in `docs/features/data-access.md`).
 *
 * React's own `useOptimistic` can only revert, so the settled outcome is held
 * here as state and used as the base the optimistic value is applied to — that
 * is what makes `KEEP` expressible and what keeps the server's confirmed value,
 * and any error, on screen after the transition ends.
 *
 * The snapshot records which `value` it was computed against, so the moment a
 * fresher prop arrives — the revalidation landing, an update from elsewhere —
 * the prop wins and the snapshot is dropped. Nothing stale outlives the truth.
 * The failure is held apart from it and survives: a value can be superseded, the
 * reason a write did not land cannot, or a save fails and nobody is told.
 */
function useOptimisticAction<TValue, TCode extends string = ActionErrorCode>({
  value,
  failureBehavior,
  isSameValue,
}: UseOptimisticActionOptions<TValue>): UseOptimisticActionResult<TValue, TCode> {
  // Defaulted here rather than in the parameter list: the React Compiler cannot
  // lower a destructured default and skips the whole hook when it meets one.
  const isSame = isSameValue ?? Object.is;

  // Whatever codes a domain declares, the wrapper can always answer with a shared
  // one — no session, a broken request — so the state carries both unions.
  type Code = TCode | ActionErrorCode;

  const [settled, setSettled] = useState<SettledSnapshot<TValue, Code> | null>(null);
  const [isPending, startTransition] = useTransition();

  // Held apart from the snapshot on purpose. A value goes stale — a fresher prop
  // is a better answer than the one this write predicted — but the reason a write
  // did not land never does, and retiring it with the snapshot is how a failure
  // reaches nobody. Only `reset` and the next `run` clear it.
  const [failure, setFailure] = useState<ActionFailureDetail<Code> | null>(null);

  // Which call owns the screen. Bumped by every `run` and by `reset`, so a
  // response that arrives after either one settles its own promise and writes
  // nothing.
  const currentCall = useRef(0);

  const isSnapshotCurrent = settled !== null && isSame(settled.source, value);
  const base: OptimisticState<TValue, Code> = isSnapshotCurrent
    ? settled.state
    : idleOptimistic<TValue, Code>(value);

  const [state, showOptimistic] = useOptimistic(base, startOptimistic<TValue, Code>);

  function run<TData>(
    optimistic: TValue,
    action: () => Promise<ActionResult<TData, TCode>>,
    options: RunOptions<TData, TValue> = {},
  ): Promise<ActionResult<TData, Code>> {
    // `Promise.withResolvers` is newer than the browsers we serve and is a runtime
    // API no transpiler fills in. The executor runs before `new Promise` returns,
    // so `resolve` is assigned by the time anything can call `settle`.
    let resolve: ((result: ActionResult<TData, Code>) => void) | undefined;
    const promise = new Promise<ActionResult<TData, Code>>((settleCall) => {
      resolve = settleCall;
    });

    currentCall.current += 1;

    const call = currentCall.current;

    /** The server's own value for this write, or `undefined` to leave `optimistic` standing. */
    function confirmedValue(result: ActionResult<TData, Code>): { value: TValue } | undefined {
      if (result.status !== ACTION_STATUS.SUCCESS || options.successValue === undefined) {
        return undefined;
      }

      try {
        return { value: options.successValue(result.data) };
      } catch (error) {
        // The write landed. A mapper that cannot read what came back is a defect
        // of ours and belongs in the console — reported as a failed write instead,
        // it would tell the User to retry a row that is already committed.
        console.error(error);

        return undefined;
      }
    }

    /** Writes the outcome only while this call still owns the screen, and answers its caller either way. */
    function settle(result: ActionResult<TData, Code>): void {
      if (call === currentCall.current) {
        const settledState = settleOptimistic<TValue, Code>({
          previous: value,
          optimistic,
          result,
          failureBehavior,
          successValue: confirmedValue(result),
        });

        setSettled({ source: value, state: settledState });
        setFailure(settledState.error);
      }

      resolve?.(result);
    }

    startTransition(async () => {
      setSettled(null);
      setFailure(null);
      showOptimistic(optimistic);

      let result: ActionResult<TData, Code>;

      try {
        result = await action();
      } catch {
        // An action returns its failures, so reaching here means the request itself
        // broke. Same contract as the server: settle with a code, never throw at
        // the caller, who may not be awaiting this at all. Only the request is
        // inside this `try` — a throw from anything below would be a defect of
        // ours, and answering `UNEXPECTED` for it would report a written row as
        // an unwritten one.
        result = actionFailure<Code>(ACTION_ERROR.UNEXPECTED);
      }

      settle(result);
    });

    return promise;
  }

  function reset(): void {
    // Retires whatever is in flight too, so a dismissal is not undone a moment
    // later by a response that was already on its way.
    currentCall.current += 1;

    setSettled(null);
    setFailure(null);
  }

  return {
    value: state.value,
    // Read off the failure first: a fresher prop replaces the value on screen
    // without taking the reason the last write did not land away with it.
    status: failure === null ? state.status : ACTION_STATUS.FAILURE,
    error: failure,
    isPending,
    run,
    reset,
  };
}

export type { RunOptions, UseOptimisticActionOptions, UseOptimisticActionResult };
export { useOptimisticAction };
