'use client';

import type { ActionStatus } from '@/constants/action';
import type { PendingAction } from '@/constants/optimistic';
import {
  type UseOptimisticSubjectOptions,
  useOptimisticSubject,
} from '@/shared/hooks/useOptimisticSubject';
import type { ActionResult } from '@/shared/lib/actionResult';
import { patchValues } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';
import { entryError, entryStatus, fieldError } from '@/shared/lib/optimistic/read';

interface UseOptimisticRecordOptions<TInput, TData, TValues extends object>
  extends UseOptimisticSubjectOptions<TInput, TData> {
  /** The server-confirmed fields, re-read on every render. */
  values: TValues;
}

interface UseOptimisticRecordResult<TValues, TData> {
  /** What to render: every server field with the store's patch overlaid. */
  values: TValues;

  /** Where the record stands, as any surface reads a call. */
  status: ActionStatus;

  /** Which kind of write each field is under — one saving while the rest are idle. */
  pendingFields: Partial<Record<string, PendingAction>>;

  /** Whether any write is out against this record. */
  isPending: boolean;

  /**
   * The record-level failure, for the message above the form. A failure that names
   * a field is filed here as well as in `fieldErrors`, so a form drawing both
   * draws only the one no field claims — otherwise it says the same thing twice.
   */
  error: OptimisticFailure | null;

  /** Failures the server named a field for, for the message beside that input. */
  fieldErrors: Partial<Record<string, OptimisticFailure>>;

  /** Writes the fields it is given, and only those. */
  run: (patch: Partial<TValues>) => Promise<ActionResult<TData>>;

  /** Clears one field's failure, or the whole attempt when given nothing. */
  dismiss: (field?: string) => void;
}

/**
 * A whole record: several fields, per-field flight state, per-field failures.
 * What a multi-field form or a detail panel renders from.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useOptimisticRecord<TInput, TData, TValues extends object>({
  descriptor,
  input,
  version,
  values,
}: UseOptimisticRecordOptions<TInput, TData, TValues>): UseOptimisticRecordResult<TValues, TData> {
  const { entry, write, dismiss } = useOptimisticSubject({ descriptor, input, version });
  const pendingFields = entry?.pendingFields ?? {};
  const pendingAction = entry?.pendingAction ?? null;
  const error = entryError(entry);
  const fieldErrors: Partial<Record<string, OptimisticFailure>> = {};

  for (const field of Object.keys(entry?.fieldErrors ?? {})) {
    const named = fieldError(entry, field);

    if (named) {
      fieldErrors[field] = named;
    }
  }

  return {
    values: patchValues(values, entry?.patch),
    status: entryStatus(entry, pendingAction, error),
    pendingFields,
    isPending: Object.keys(pendingFields).length > 0 || !!pendingAction,
    error,
    fieldErrors,
    run: (patch) => write({ ...patch }),
    dismiss,
  };
}

export type { UseOptimisticRecordOptions, UseOptimisticRecordResult };
export { useOptimisticRecord };
