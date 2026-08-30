import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';

/**
 * Which answer is still the current one. Kept apart from the store so the
 * ordering rule is one readable function rather than a branch inside a verb.
 *
 * See docs/features/data-access/store.md.
 */

/** What is left of an answer by the time it lands, or `null` when nothing is. */
interface CallOwnership {
  /**
   * The fields it may retire and file a failure against. `undefined` when the
   * write named none — a delete, a whole-row insert — which owns the key itself.
   */
  fields: readonly string[] | undefined;

  /**
   * The fields it named that a newer write has since taken over. It may still
   * settle its own, but writing these would put the value the User replaced back
   * on screen.
   */
  superseded: readonly string[];
}

/**
 * The number the next write on this key takes. Above the store's own counter and
 * above the key's own `latestCall`: an entry adopted from another tab carries
 * that tab's numbering, and starting under it would have this tab's answer read
 * as stale. A key nobody has written defaults to zero, so the first call is one.
 */
function nextCall(issued: number, latestCall = 0): number {
  return Math.max(issued, latestCall) + 1;
}

/**
 * What this call still owns of the entry its answer came back to.
 *
 * A write that named no field is measured against the key: an answer behind
 * `latestCall` is discarded whole (ADR-0012). A write that named fields is
 * measured per field, because a key is one record and a second field opening a
 * write says nothing about the first field's answer.
 *
 * Partial is the case worth having a type for: a write over `title` and `body`
 * that a later `title`-only write overtook still owns `body`, and settling it
 * whole would hand `title` back to the value the User has already replaced.
 *
 * A field nobody owns falls back to the key's own guard — its owner was retired
 * by an answer, and defaulting to zero would let the answer that answer replaced
 * land afterwards as the current one.
 */
function ownedByCall(
  entry: OptimisticEntry,
  call: number,
  fields: readonly string[] | undefined,
): CallOwnership | null {
  if (!fields?.length) {
    return call < entry.latestCall ? null : { fields: undefined, superseded: [] };
  }

  const owned = fields.filter((field) => (entry.fieldCalls[field] ?? entry.latestCall) <= call);

  if (owned.length === 0) {
    return null;
  }

  const stillOwned = new Set(owned);

  return { fields: owned, superseded: fields.filter((field) => !stillOwned.has(field)) };
}

export type { CallOwnership };
export { nextCall, ownedByCall };
