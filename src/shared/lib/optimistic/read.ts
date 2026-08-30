import { ACTION_STATUS, type ActionStatus } from '@/constants/action';
import type { PendingAction } from '@/constants/optimistic';
import type { OptimisticEntry, OptimisticFailure } from '@/shared/lib/optimistic/entry';

/**
 * Reading an entry the way a surface renders it. Kept apart from the transitions
 * so a hook is a subscription and a merge, and nothing else.
 */

/** The failure a surface shows for the whole record. */
function entryError(entry: OptimisticEntry | null): OptimisticFailure | null {
  return entry?.error ?? null;
}

/**
 * Whether a failure is about the value in one input rather than about the write.
 * The one place that rule is written: a surface drawing both a message above a
 * form and one beside an input asks this to decide which, and two spellings of it
 * would print the same sentence twice.
 */
function isFieldFailure(failure: OptimisticFailure | null | undefined, field: string): boolean {
  return !!failure?.fields?.[field];
}

/**
 * The failure a form places beside one input, and nothing when the server did not
 * name that field. A failure is filed under every field its write owned so an
 * answer on another field knows to leave it alone — that copy is bookkeeping, and
 * a reason the server never tied to this input does not belong beside it.
 */
function fieldError(entry: OptimisticEntry | null, field: string): OptimisticFailure | null {
  const failure = entry?.fieldErrors[field] ?? null;

  return isFieldFailure(failure, field) ? failure : null;
}

/**
 * Which kind of write this field is under. A write that claimed no fields — a
 * delete, a create — covers the whole record, so every field reads as in flight.
 */
function fieldPending(entry: OptimisticEntry | null, field: string): PendingAction | null {
  if (!entry) {
    return null;
  }

  return (
    entry.pendingFields[field] ??
    (Object.keys(entry.pendingFields).length === 0 ? entry.pendingAction : null)
  );
}

/**
 * Where the surface stands. Flight wins over a failure — a retry is already under
 * way — and an entry with neither is a write that landed.
 */
function entryStatus(
  entry: OptimisticEntry | null,
  pendingAction: PendingAction | null,
  error: OptimisticFailure | null,
): ActionStatus {
  if (pendingAction) {
    return ACTION_STATUS.PENDING;
  }

  if (error) {
    return ACTION_STATUS.FAILURE;
  }

  return entry ? ACTION_STATUS.SUCCESS : ACTION_STATUS.IDLE;
}

export { entryError, entryStatus, fieldError, fieldPending, isFieldFailure };
