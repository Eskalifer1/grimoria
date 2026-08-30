import type { PendingAction } from '@/constants/optimistic';
import { patchValues } from '@/shared/lib/optimistic/descriptor';
import type { OptimisticSnapshot } from '@/shared/lib/optimistic/entries';
import type { OptimisticFailure, OptimisticPatch } from '@/shared/lib/optimistic/entry';
import { entryError } from '@/shared/lib/optimistic/read';

/**
 * Merging the store's overlay into a server-rendered list. Pure, so
 * `useOptimisticList` is a subscription and two verbs and nothing else.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */

/** One row as a list renders it: the value, where its write stands, and why it failed. */
interface OptimisticListRow<TItem> {
  /** The store key this row is addressed by. Stable across a reload, so it is the React key too. */
  key: string;

  /** The server's row with the store's patch overlaid, or the whole row when it is a draft. */
  item: TItem;

  /** Which kind of write is in flight against this row, and `null` when none is. */
  pendingAction: PendingAction | null;

  /** Why this row's last write failed, and `null` when nothing did. */
  error: OptimisticFailure | null;

  /** True while the row exists on the client only. */
  isDraft: boolean;
}

/**
 * Whether a patch is one of this list's rows rather than a field write on a
 * record the list also holds.
 *
 * A draft carries the whole row, so rebuilding its key from it lands back on the
 * key it is filed under; a changed-fields patch has no id and rebuilds to
 * something else. The store holds `unknown` by design, and this round trip is
 * what makes the assertion true rather than assumed — including when `keyOf`
 * throws on a shape it was never written for, which is another patch's answer to
 * "this is not one of mine".
 */
function isDraftOf<TItem>(key: string, patch: OptimisticPatch, keyOf: (item: TItem) => string) {
  try {
    return keyOf(patch as TItem) === key;
  } catch {
    return false;
  }
}

/**
 * Drafts first, then the server's rows, minus the ones a removal has settled.
 *
 * A draft is rebuilt from the store rather than held in React state — the whole
 * row travels as the write's optimistic value, so a create that failed still has
 * its content on screen after a reload, which is the promise the pattern makes
 * for every other write.
 */
function listRows<TItem extends object>(
  entries: OptimisticSnapshot,
  items: readonly TItem[],
  removed: readonly string[],
  keyOf: (item: TItem) => string,
): readonly OptimisticListRow<TItem>[] {
  const confirmedKeys = new Set(items.map(keyOf));
  const removedKeys = new Set(removed);

  function toRow(item: TItem, isDraft: boolean): OptimisticListRow<TItem> {
    const key = keyOf(item);
    const entry = entries[key] ?? null;

    return {
      key,
      item: patchValues(item, entry?.patch),
      pendingAction: entry?.pendingAction ?? null,
      error: entryError(entry),
      isDraft,
    };
  }

  const drafts = Object.entries(entries)
    .filter(([key, entry]) => !confirmedKeys.has(key) && isDraftOf(key, entry.patch, keyOf))
    .map(([, entry]) => entry.patch as TItem);

  return [
    ...drafts.map((item) => toRow(item, true)),
    ...items.filter((item) => !removedKeys.has(keyOf(item))).map((item) => toRow(item, false)),
  ];
}

export type { OptimisticListRow };
export { listRows };
