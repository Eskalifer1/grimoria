import type { OptimisticErrorCode, PendingAction } from '@/constants/optimistic';
import type { ActionFieldErrors } from '@/shared/lib/actionResult';

/** Changed fields only, overlaid on the server's value at render time. Never a whole entity. */
type OptimisticPatch = Record<string, unknown>;

/** The attempt number a failure with no call behind it files under. No call is ever numbered zero. */
const NO_ATTEMPT = 0;

/** Why one attempt failed. A code, never a sentence — a locale change must not invalidate stored state. */
interface OptimisticFailure {
  code: OptimisticErrorCode;
  fields: ActionFieldErrors | null;

  /**
   * The call that recorded it. What ties the record's copy of a failure to each
   * field's, so dismissing one field clears only what that field filed. A number
   * rather than the moment: two writes can settle in the same millisecond.
   */
  attempt: number;
}

/** One key's worth of "what is different from the server, and why". */
interface OptimisticEntry {
  /** Changed fields only. Overlaid on the server's value at render time. */
  patch: OptimisticPatch;

  /** Which kind of write is in flight, and `null` once it settles. */
  pendingAction: PendingAction | null;

  /** Per-field flight state, for a form where one field is saving and others are not. */
  pendingFields: Partial<Record<string, PendingAction>>;

  /** The record's failure — the message above a form, or beside a row. */
  error: OptimisticFailure | null;

  /** Failures a form places beside one input. Two fields may hold different ones. */
  fieldErrors: Partial<Record<string, OptimisticFailure>>;

  /** The `updatedAt` the patch was built against. Decides when the entry is superseded. */
  sourceVersion: string | null;

  /** Latest call number seen for this key. What decides a stale answer to a write that named no field. */
  latestCall: number;

  /**
   * The call that owns each field. A key is one record and a write is one field
   * of it, so a second field opening a write must not make the first field's
   * answer look stale — `latestCall` alone cannot tell those apart.
   */
  fieldCalls: Partial<Record<string, number>>;

  /** When this entry last changed. What its age is measured from, and so what expires it. */
  touchedAt: number;
}

/**
 * One decision per field, so adding a field to `OptimisticEntry` is a `tsc`
 * error until somebody says whether it crosses a reload. Modeled on Expensify's
 * `ExportOnyxStateTest`; `docs/features/data-access/store.md` records each line.
 */
const OPTIMISTIC_ENTRY_PERSISTENCE: Record<keyof OptimisticEntry, boolean> = {
  patch: true,
  pendingAction: true,
  pendingFields: true,
  error: true,
  fieldErrors: true,
  sourceVersion: true,
  // Numbers only the page that issued them can compare against. A fresh page has
  // no outstanding calls, so they restart empty.
  latestCall: false,
  fieldCalls: false,
  touchedAt: true,
};

function emptyEntry(touchedAt: number): OptimisticEntry {
  return {
    patch: {},
    pendingAction: null,
    pendingFields: {},
    error: null,
    fieldErrors: {},
    sourceVersion: null,
    latestCall: 0,
    fieldCalls: {},
    touchedAt,
  };
}

/**
 * A failure the client itself decided on — a schema the form rejected before
 * sending, a surface with nothing to explain a block with — so that a component
 * never writes the shape out by hand to hand it to a message hook.
 */
function clientFailure(code: OptimisticErrorCode): OptimisticFailure {
  return { code, fields: null, attempt: NO_ATTEMPT };
}

/** Whether a write is still out against this entry, on the record or on any of its fields. */
function isEntryPending(entry: OptimisticEntry): boolean {
  return !!entry.pendingAction || Object.keys(entry.pendingFields).length > 0;
}

/** Whether anything failed against this entry, on the record or on any of its fields. */
function isEntryFailed(entry: OptimisticEntry): boolean {
  return !!entry.error || Object.keys(entry.fieldErrors).length > 0;
}

/** Whether anything about this entry is still worth rendering. A dead entry is deleted, not kept empty. */
function isEntryLive(entry: OptimisticEntry): boolean {
  return isEntryPending(entry) || isEntryFailed(entry) || Object.keys(entry.patch).length > 0;
}

export type { OptimisticEntry, OptimisticFailure, OptimisticPatch };
export {
  clientFailure,
  emptyEntry,
  isEntryFailed,
  isEntryLive,
  isEntryPending,
  NO_ATTEMPT,
  OPTIMISTIC_ENTRY_PERSISTENCE,
};
