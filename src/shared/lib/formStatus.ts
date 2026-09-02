import { SUBMIT_LOCK, type SubmitLock } from '@/constants/form';
import type { ActionFailureDetail } from '@/shared/lib/actionResult';

/**
 * Why a write failed, in the one shape a store entry and a bare action result
 * both satisfy — the form layer never learns which of the two it was handed.
 */
type FormFailure = ActionFailureDetail<string>;

/**
 * What the server has said about a form, read at render and never pushed into
 * react-hook-form: `formState` dies with the component while a write in the
 * store survives a reload, so pushing means keeping two copies in step.
 *
 * What the User typed comes from `useFormContext()` instead.
 */
interface FormStatus {
  /** Why the last write failed, when the reason belongs to the write and not to one field. */
  error: FormFailure | null;

  /** Why the last write failed, per field the server named one for. */
  fieldErrors: Partial<Record<string, FormFailure>>;

  /** Throws the failure away. `null` where nothing may be dismissed. */
  dismiss: (() => void) | null;

  /** Whether a write is out. Never a reason to disable an input. */
  isPending: boolean;

  /** What that write in flight locks. */
  submitLock: SubmitLock;
}

/**
 * One entry per field the server named **and this form draws**, each pointing at
 * the one reason it gave. A server may name a field the form has no input for —
 * a schema wider than the surface, a rename that landed on one side only — and a
 * message placed beside nothing is a message no one reads.
 *
 * @param drawn the form's values, whose keys are the fields it has an input for
 */
function drawnFieldErrors(
  failure: FormFailure | null,
  drawn: Record<string, unknown>,
): Partial<Record<string, FormFailure>> {
  if (!failure?.fields) {
    return {};
  }

  const names = new Set(Object.keys(drawn));

  return Object.fromEntries(
    Object.keys(failure.fields)
      .filter((field) => names.has(field))
      .map((field) => [field, failure]),
  );
}

/** Nothing has been written yet, which is also what a form outside any write reads. */
const IDLE_FORM_STATUS: FormStatus = {
  error: null,
  fieldErrors: {},
  dismiss: null,
  isPending: false,
  submitLock: SUBMIT_LOCK.NONE,
};

/** The half of a `useOptimisticValue` result a form needs, so this file imports no hook. */
interface OptimisticFieldStatus {
  /** Why the last write failed, whether or not the server named a field. */
  error: FormFailure | null;

  /** The half of `error` the server named this field for, and `null` when it named none. */
  fieldError: FormFailure | null;

  /** Whether a write is out against this field. */
  isPending: boolean;

  /** Throws the attempt away — the failure and the value it belongs to. */
  dismiss: () => void;
}

/**
 * The status of an optimistic single-field write, as a form reads it. The hook's
 * `error` is already the field's whenever the server named one, so the form-level
 * half is dropped there — drawn as well, it would print the same reason twice.
 *
 * @param field the name the write is filed under, in the form's values
 */
function optimisticFormStatus(field: string, value: OptimisticFieldStatus): FormStatus {
  return {
    error: value.fieldError ? null : value.error,
    fieldErrors: value.fieldError ? { [field]: value.fieldError } : {},
    dismiss: value.dismiss,
    isPending: value.isPending,
    // Pattern B: the value is already on screen, so a second submit is a second
    // write and not a duplicate of the first.
    submitLock: SUBMIT_LOCK.NONE,
  };
}

export type { FormFailure, FormStatus, OptimisticFieldStatus };
export { drawnFieldErrors, IDLE_FORM_STATUS, optimisticFormStatus };
