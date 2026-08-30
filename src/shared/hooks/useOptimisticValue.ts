'use client';

import type { ActionStatus } from '@/constants/action';
import type { PendingAction } from '@/constants/optimistic';
import {
  type OptimisticFailureMode,
  type UseOptimisticSubjectOptions,
  useOptimisticSubject,
} from '@/shared/hooks/useOptimisticSubject';
import type { ActionResult } from '@/shared/lib/actionResult';
import { patchField } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';
import { entryError, entryStatus, fieldError, fieldPending } from '@/shared/lib/optimistic/read';

interface UseOptimisticValueOptions<
  TInput,
  TData,
  TField extends Extract<keyof TInput, string>,
  TValue extends TInput[TField],
> extends UseOptimisticSubjectOptions<TInput, TData> {
  /** The field this hook owns, in the action's input and in the patch alike. */
  field: TField;

  /** The server-confirmed value, re-read on every render. */
  value: TValue;

  /**
   * What a refusal leaves on screen. `keep` is pattern B's default — the value
   * the User chose stands, with the reason beside it, because throwing their work
   * away to make room for a message is the worse of the two.
   *
   * `rollback` returns the field to the server's value and still says why: what a
   * control with no half-state — a toggle, a Theme — needs, since there is nothing
   * for a rejected value to sit in.
   *
   * `silent` rolls back and records nothing, which is pattern A. It is only
   * allowed where a lost write costs nothing, and it is the only one of the three
   * that leaves the store as it found it.
   */
  onFailure?: OptimisticFailureMode;
}

interface UseOptimisticValueResult<TValue, TData> {
  /** What to render: the optimistic value while there is one, the server's otherwise. */
  value: TValue;

  /** Where the field stands, as any surface reads a call. */
  status: ActionStatus;

  /** Which kind of write is in flight, and `null` when none is. */
  pendingAction: PendingAction | null;

  /** Whether a write is out against this field. */
  isPending: boolean;

  /** Why the last write failed. It outlives the value, and only a dismissal clears it. */
  error: OptimisticFailure | null;

  /**
   * The half of `error` the server named this field for. What a leaf inside an
   * `OptimisticRow` renders: the row owns the key and already shows everything
   * that belongs to the record, so a leaf repeating it prints the failure twice.
   */
  fieldError: OptimisticFailure | null;

  /** Shows `next` at once and sends it. Resolves with the action's own result. */
  run: (next: TValue) => Promise<ActionResult<TData>>;

  /** Throws the attempt away — the failure and the value it belongs to. */
  dismiss: () => void;
}

/**
 * One field, one write: `useOptimisticRecord` narrowed to a single value, which
 * is the shape most surfaces want. `onFailure` is which pattern this is — `keep`
 * is B, `silent` is A, `rollback` is B for a control that has no room to hold a
 * value the server refused.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useOptimisticValue<
  TInput,
  TData,
  TField extends Extract<keyof TInput, string>,
  TValue extends TInput[TField],
>({
  descriptor,
  input,
  version,
  field,
  value,
  onFailure,
}: UseOptimisticValueOptions<TInput, TData, TField, TValue>): UseOptimisticValueResult<
  TValue,
  TData
> {
  const { entry, write, dismiss } = useOptimisticSubject({ descriptor, input, version });
  const pendingAction = fieldPending(entry, field);
  const named = fieldError(entry, field);
  const error = named ?? entryError(entry);

  return {
    value: patchField(entry?.patch, field, value),
    status: entryStatus(entry, pendingAction, error),
    pendingAction,
    isPending: !!pendingAction,
    error,
    fieldError: named,
    run: (next) => write({ [field]: next }, onFailure),
    // Always named, never the whole record: a key is one record, and this hook
    // owns one field of it. Dismissing the key would take every other field's
    // unsaved value down with a message about this one — which is what a reason
    // the server named no field for, a timeout or an interruption, used to do.
    dismiss: () => dismiss(field),
  };
}

export type { OptimisticFailureMode, UseOptimisticValueOptions, UseOptimisticValueResult };
export { useOptimisticValue };
