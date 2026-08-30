import {
  OPTIMISTIC_ERROR,
  type OptimisticErrorCode,
  type PendingAction,
} from '@/constants/optimistic';
import type { ActionFieldErrors } from '@/shared/lib/actionResult';
import {
  emptyEntry,
  isEntryFailed,
  isEntryLive,
  isEntryPending,
  NO_ATTEMPT,
  type OptimisticEntry,
  type OptimisticFailure,
  type OptimisticPatch,
} from '@/shared/lib/optimistic/entry';

/**
 * Every move an entry can make. Kept apart from its shape so the transitions are
 * readable as a set and `entry.ts` stays the answer to "what is stored".
 */

/** The inputs a write is opened with. */
interface BeginEntryInput {
  action: PendingAction;

  /** The `optimisticData` slot — the changed fields to put on screen at once. */
  optimisticData?: OptimisticPatch;

  /** Which fields this write owns. Defaults to the keys of `optimisticData`. */
  fields?: readonly string[];

  /** The server's `updatedAt` the write was computed from. */
  sourceVersion?: string | null;
}

/** The three slots a success may carry, applied in the order they are declared. */
interface SettleSuccessInput {
  /** What the server answered. Applied first — the server is the authority on what the value became. */
  serverData?: OptimisticPatch;

  /** The `successData` slot. Written by hand, so it beats the server's value on the same field. */
  successData?: OptimisticPatch;

  /** The `finallyData` slot. Applied last, on both paths. */
  finallyData?: OptimisticPatch;

  /** The `updatedAt` the server answered with, which the entry is then dated by. */
  serverVersion?: string | null;

  /** Which fields this answer owns. Every other field's write is left in flight. */
  fields?: readonly string[];

  /** Fields this write named that a newer one has taken over. Its answer may not write them. */
  superseded?: readonly string[];
}

/** What a failure carries. There is no automatic rollback — a rollback is asked for. */
interface SettleFailureInput {
  error: { code: OptimisticErrorCode; fields?: ActionFieldErrors | null };

  /** The `failureData` slot. Carrying the previous value here is what a rollback is. */
  failureData?: OptimisticPatch;

  /**
   * Fields the failure hands back to the server, by dropping them from the patch.
   * What a control that cannot show a wrong value — a toggle, a Theme — asks for,
   * and cheaper than naming the old value: the render already has it.
   */
  rollback?: readonly string[];

  /**
   * Records no reason. A silent write (pattern A) has no surface to show one, and
   * the reason would be read by every other surface sharing the key.
   */
  isSilent?: boolean;

  /** The `finallyData` slot. Applied last, on both paths. */
  finallyData?: OptimisticPatch;

  /** Which fields this answer owns. Every other field's write is left in flight. */
  fields?: readonly string[];

  /** Fields this write named that a newer one has taken over. Its answer may not write them. */
  superseded?: readonly string[];
}

/**
 * Which fields a write owns: the ones it named, or — when it named none — the
 * ones its optimistic value changed. Written here and read by `runOptimistic` and
 * by the hooks, so the store's guard and the caller cannot disagree about what a
 * write covers.
 */
function writtenFields(
  fields: readonly string[] | undefined,
  optimisticData: OptimisticPatch | undefined,
): readonly string[] {
  return fields ?? Object.keys(optimisticData ?? {});
}

/**
 * A slot as this answer may write it. A field a newer write has taken over is
 * dropped: the answer is still the current one for everything else it named, but
 * putting that field back would show the value the User has already replaced.
 */
function scoped(
  patch: OptimisticPatch | undefined,
  superseded: readonly string[] | undefined,
): OptimisticPatch {
  if (!patch || !superseded?.length) {
    return patch ?? {};
  }

  const takenOver = new Set(superseded);

  return Object.fromEntries(Object.entries(patch).filter(([field]) => !takenOver.has(field)));
}

/**
 * The record's copy of a failure, kept only while a field still claims it.
 *
 * One attempt is filed under every field its write owned and once against the
 * record, and the record's copy is the message above a form. It therefore stands
 * exactly as long as one of those fields is still showing the same attempt —
 * which is also what retires a reason no field was named for, an interruption or
 * a timeout, along with the write it was about.
 */
function claimedError(
  error: OptimisticFailure | null,
  fieldErrors: Partial<Record<string, OptimisticFailure>>,
): OptimisticFailure | null {
  if (!error) {
    return null;
  }

  return Object.values(fieldErrors).some((failure) => failure?.attempt === error.attempt)
    ? error
    : null;
}

/**
 * What is left of an entry's failures once these fields' share is taken out. The
 * rule a write's two ends share: opening one over a field and settling one make
 * that field's reason stale alike, and neither may take another field's reason
 * down with it.
 *
 * Nothing named retires the record's failures whole — empty and absent mean the
 * same thing here as they do to `settledFlight`, so a write cannot own the key
 * for one and no field for the other.
 */
function remainingErrors(
  entry: OptimisticEntry,
  fields: readonly string[] | undefined,
): Pick<OptimisticEntry, 'error' | 'fieldErrors'> {
  if (!fields?.length) {
    return { error: null, fieldErrors: {} };
  }

  const fieldErrors = { ...entry.fieldErrors };

  for (const field of fields) {
    delete fieldErrors[field];
  }

  return { error: claimedError(entry.error, fieldErrors), fieldErrors };
}

/**
 * Opens or extends a write. A second write merges into the first — two fields of
 * one form must not conflict — and clears what the last attempt on those fields
 * refused, since the User is being told the answer is being asked for again.
 */
function beginEntry(
  entry: OptimisticEntry | null,
  input: BeginEntryInput,
  call: number,
  at: number,
): OptimisticEntry {
  const base = entry ?? emptyEntry(at);
  const pendingFields = { ...base.pendingFields };
  const fieldCalls = { ...base.fieldCalls };
  const ownedFields = writtenFields(input.fields, input.optimisticData);

  for (const field of ownedFields) {
    pendingFields[field] = input.action;
    fieldCalls[field] = call;
  }

  return {
    ...base,
    // A retry says the answer is being asked for again, so the reason the last
    // attempt on these fields gave goes now rather than a round trip later.
    ...remainingErrors(base, ownedFields),
    patch: { ...base.patch, ...input.optimisticData },
    pendingAction: input.action,
    pendingFields,
    fieldCalls,
    sourceVersion: base.sourceVersion ?? input.sourceVersion ?? null,
    latestCall: call,
    touchedAt: at,
  };
}

/** What one answer clears of the flight state, leaving every other write's alone. */
type SettledFlight = Pick<OptimisticEntry, 'pendingAction' | 'pendingFields' | 'fieldCalls'>;

/**
 * Retires the fields this answer owns and leaves the rest in flight. Clearing the
 * lot would take the marker off a field whose own answer is still coming, and
 * `pendingAction` is then whatever is left rather than nothing.
 *
 * Nothing named — a delete, a whole-row insert, a caller that settles the store
 * directly — retires the key. Empty and absent mean the same thing here as they
 * do to `clearedErrors`, so a write cannot own the key for one and no field for
 * the other.
 */
function settledFlight(
  entry: OptimisticEntry,
  fields: readonly string[] | undefined,
): SettledFlight {
  if (!fields?.length) {
    return { pendingAction: null, pendingFields: {}, fieldCalls: {} };
  }

  const pendingFields = { ...entry.pendingFields };
  const fieldCalls = { ...entry.fieldCalls };

  for (const field of fields) {
    delete pendingFields[field];
    delete fieldCalls[field];
  }

  return { pendingAction: Object.values(pendingFields)[0] ?? null, pendingFields, fieldCalls };
}

/**
 * Settles a write that landed. The server's response goes in first and any
 * hand-written slot on top of it, so an optimistic `"Test"` the server stored as
 * `"Test2"` ends up as `"Test2"` — without a deliberate slot being ignored.
 *
 * Returns `null` when the success left nothing to overlay. Written back instead,
 * the key would sit in the document until the next page load: a list never
 * reconciles, so nothing else would ever remove it.
 */
function settleSuccessEntry(
  entry: OptimisticEntry,
  input: SettleSuccessInput,
  at: number,
): OptimisticEntry | null {
  const settled: OptimisticEntry = {
    ...entry,
    ...settledFlight(entry, input.fields),
    // Only what this answer's own fields filed. Another field's write may have
    // failed while this one was out, and its reason is not this answer's to take
    // off the screen.
    ...remainingErrors(entry, input.fields),
    patch: {
      ...entry.patch,
      ...scoped(input.serverData, input.superseded),
      ...scoped(input.successData, input.superseded),
      ...scoped(input.finallyData, input.superseded),
    },
    sourceVersion: input.serverVersion ?? entry.sourceVersion,
    touchedAt: at,
  };

  return isEntryLive(settled) ? settled : null;
}

/**
 * Settles a write that refused. The optimistic value stands unless the caller
 * asks otherwise — there is no automatic rollback (ADR-0011). `rollback` hands
 * the named fields back to the server, `isSilent` records no reason, and asking
 * for both is what pattern A is. A silent rollback can leave nothing behind, so
 * the caller checks `isEntryLive` before writing it back.
 *
 * The failure is filed under every field this write owned, not only the ones the
 * server named: that is what says whose failure it is, so an answer on another
 * field knows to leave it alone. A field a newer write has taken over is not one
 * of them — its own answer is what will speak for it.
 *
 * Returns `null` when the failure left nothing behind, which is what a silent
 * rollback is: kept empty, the key would pin every later render against a patch
 * nobody can see, dismiss, or reconcile away.
 */
function settleFailureEntry(
  entry: OptimisticEntry,
  input: SettleFailureInput,
  call: number,
  at: number,
): OptimisticEntry | null {
  const failure: OptimisticFailure = {
    code: input.error.code,
    fields: input.error.fields ?? null,
    attempt: call,
  };
  const takenOver = new Set(input.superseded ?? []);
  const fieldErrors = { ...entry.fieldErrors };

  for (const field of new Set([...(input.fields ?? []), ...Object.keys(failure.fields ?? {})])) {
    if (!takenOver.has(field)) {
      fieldErrors[field] = failure;
    }
  }

  const patch = {
    ...entry.patch,
    ...scoped(input.failureData, input.superseded),
    ...scoped(input.finallyData, input.superseded),
  };

  for (const field of input.rollback ?? []) {
    if (!takenOver.has(field)) {
      delete patch[field];
    }
  }

  const settled: OptimisticEntry = {
    ...entry,
    ...settledFlight(entry, input.fields),
    patch,
    // Replaced, not added to: this answer is the whole truth about the write, and
    // an earlier attempt's reason stacked under it would say the same thing twice.
    error: input.isSilent ? entry.error : failure,
    fieldErrors: input.isSilent ? entry.fieldErrors : fieldErrors,
    touchedAt: at,
  };

  return isEntryLive(settled) ? settled : null;
}

/**
 * Throws the attempt away: the errors go, and so does the value they belong to.
 * A dismissed failed `add` therefore removes its row, and a dismissed failed
 * `update` falls back to the server's value. Returns `null` when nothing is left.
 *
 * Naming a field dismisses that field's share of it, and the record's copy with
 * it when the two are the same attempt — otherwise the button clears nothing the
 * User can see. A failure naming no field is the form's and stays, unless the
 * record holds no field failures at all: the reason is then on screen under this
 * field and nowhere else, and clearing it any other way would take every other
 * field's unsaved value down with a message about this one.
 *
 * Not `remainingErrors`: a retry is redoing the write a form-level reason was
 * about, so that reason goes with it, while a dismissal on one field is not that
 * reason's to take off the screen.
 */
function dismissEntry(entry: OptimisticEntry, field?: string): OptimisticEntry | null {
  if (field === undefined) {
    const dismissed = { ...entry, patch: {}, error: null, fieldErrors: {} };

    return isEntryLive(dismissed) ? dismissed : null;
  }

  const failure = entry.fieldErrors[field];
  const isOnlyHere = Object.keys(entry.fieldErrors).length === 0;
  const patch = { ...entry.patch };
  const fieldErrors = { ...entry.fieldErrors };

  delete patch[field];
  delete fieldErrors[field];

  const dismissed: OptimisticEntry = {
    ...entry,
    patch,
    fieldErrors,
    error: isOnlyHere || (failure && entry.error?.attempt === failure.attempt) ? null : entry.error,
  };

  return isEntryLive(dismissed) ? dismissed : null;
}

/**
 * An entry still in flight when the page died. Dropping it would eat what the
 * User typed and leaving it pending would spin forever, so it becomes a failure
 * nobody knows the end of.
 */
function interruptEntry(entry: OptimisticEntry, at: number): OptimisticEntry {
  if (!isEntryPending(entry)) {
    return entry;
  }

  // Never `null`: the interruption is itself a reason, so the entry always has
  // something left to hold. The fallback is what says so to `tsc`.
  return (
    settleFailureEntry(entry, { error: { code: OPTIMISTIC_ERROR.INTERRUPTED } }, NO_ATTEMPT, at) ??
    entry
  );
}

/**
 * Whether one version is older than another. Parsed rather than compared as text:
 * two spellings of one instant sort against each other, and calling the server's
 * the older one pins the overlay on screen with nothing left to retire it.
 */
function isBefore(version: string, other: string): boolean {
  const left = Date.parse(version);
  const right = Date.parse(other);

  return Number.isNaN(left) || Number.isNaN(right) ? version < other : left < right;
}

/**
 * The server render caught up: the overlay has nothing left to add, so it goes.
 *
 * A write in flight is never superseded, or a revalidation would be how the User
 * finds out their save was lost. Neither is a write that failed: the server holds
 * the value it always held, so dropping the patch would take the User's unsaved
 * work away and leave the error explaining a value no longer on screen.
 *
 * Without a version on either side there is no render to have caught up, and such
 * an entry ends at a dismissal or at its age.
 */
function reconcileEntry(
  entry: OptimisticEntry,
  serverVersion: string | null,
): OptimisticEntry | null {
  if (isEntryPending(entry) || isEntryFailed(entry)) {
    return entry;
  }

  if (!entry.sourceVersion || !serverVersion || isBefore(serverVersion, entry.sourceVersion)) {
    return entry;
  }

  const superseded = { ...entry, patch: {} };

  return isEntryLive(superseded) ? superseded : null;
}

export type { BeginEntryInput, SettleFailureInput, SettleSuccessInput };
export {
  beginEntry,
  dismissEntry,
  interruptEntry,
  reconcileEntry,
  settleFailureEntry,
  settleSuccessEntry,
  writtenFields,
};
