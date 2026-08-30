'use client';

import { useEffect, useState } from 'react';

import { useOptimisticSnapshot } from '@/shared/hooks/useOptimisticEntry';
import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';
import { type ActionResult, isActionSuccess } from '@/shared/lib/actionResult';
import type { OptimisticDescriptor } from '@/shared/lib/optimistic/descriptor';
import { listRows, type OptimisticListRow } from '@/shared/lib/optimistic/list';
import { runOptimistic } from '@/shared/lib/optimistic/run';

interface UseOptimisticListOptions<TItem, TAddInput, TAddData, TRemoveInput, TRemoveData> {
  /** The server's list, re-read on every render. */
  items: readonly TItem[];

  /** The insert, as a descriptor. Its `optimisticData` is the whole row. */
  add: OptimisticDescriptor<TAddInput, TAddData>;

  /** The removal, as a descriptor. Its key format is what every row is addressed by. */
  remove: OptimisticDescriptor<TRemoveInput, TRemoveData>;

  /** The remove input for one item — how a row finds its key without naming the format. */
  identify: (item: TItem) => TRemoveInput;

  /** The row to show at once for an insert the server has not confirmed. */
  draft: (input: TAddInput) => TItem;

  /**
   * The server's version for one row. Without it a confirmed row's overlay never
   * retires and grows in `localStorage` for the life of the entry.
   */
  version?: (item: TItem) => string | null;
}

interface UseOptimisticListResult<TItem, TAddInput, TAddData, TRemoveData> {
  /** Drafts first, then the server's rows, minus the ones a removal has settled. */
  items: readonly OptimisticListRow<TItem>[];

  /** Shows the drafted row at once and sends the insert. */
  add: (input: TAddInput) => Promise<ActionResult<TAddData>>;

  /** Keeps the row in place, struck through, until the removal settles. */
  remove: (item: TItem) => Promise<ActionResult<TRemoveData>>;

  /** Throws one row's attempt away — its failure and the value it belongs to. */
  dismiss: (item: TItem) => void;
}

/**
 * A collection: an insert addressable before the server confirms it (ADR-0010),
 * a removal that keeps the row in place while it is in flight, and the merge of
 * both into the server's list — which is `listRows`, so this hook is the
 * subscription and the verbs.
 *
 * Which rows a removal has settled is the one thing held here: it is an answer
 * about *this* list, not a fact about a record, and the next server render
 * settles it.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useOptimisticList<TItem extends object, TAddInput, TAddData, TRemoveInput, TRemoveData>({
  items,
  add,
  remove,
  identify,
  draft,
  version,
}: UseOptimisticListOptions<
  TItem,
  TAddInput,
  TAddData,
  TRemoveInput,
  TRemoveData
>): UseOptimisticListResult<TItem, TAddInput, TAddData, TRemoveData> {
  const entries = useOptimisticSnapshot();
  const store = useOptimisticStore();
  const [removed, setRemoved] = useState<readonly string[]>([]);

  const keyOf = (item: TItem) => remove.key(identify(item));

  // No dependency list: `reconcile` is a no-op unless a render has caught up with
  // an entry, and the alternative is encoding every row's key and version into one
  // string so an effect can compare it.
  useEffect(() => {
    const live = new Set<string>();

    for (const item of items) {
      const key = keyOf(item);

      live.add(key);
      store.reconcile(key, version?.(item) ?? null);
    }

    // A key the server has stopped sending is a removal it has agreed to, so there
    // is nothing left to hide. Held past that, the key outlives the row it was
    // about and hides the next row to arrive under it — a re-seed, a restore, an
    // insert reusing the id — with no way back but a reload.
    setRemoved((held) =>
      held.every((key) => live.has(key)) ? held : held.filter((key) => live.has(key)),
    );
  });

  return {
    items: listRows(entries, items, removed, keyOf),

    add(input) {
      // The whole row travels, not just the fields the action takes: it is what
      // rebuilds the draft on the next page when nobody answered this call.
      return runOptimistic(add, input, {
        // `fromEntries` rather than a spread: a patch is an index signature and
        // an item is usually an interface, which has none.
        optimisticData: Object.fromEntries(Object.entries(draft(input))),
        store,
      });
    },

    async remove(item) {
      const key = keyOf(item);
      // No fields: a delete owns the whole row, not one of its values.
      const result = await runOptimistic(remove, identify(item), { fields: [], store });

      if (isActionSuccess(result)) {
        // Held only until the read that proves it: the effect above drops the key
        // the moment the server's list stops carrying it.
        setRemoved((held) => (held.includes(key) ? held : [...held, key]));
        // Nothing left to say about a row the server has agreed to drop.
        store.dismiss(key);
      }

      return result;
    },

    dismiss: (item) => store.dismiss(keyOf(item)),
  };
}

export type { OptimisticListRow, UseOptimisticListOptions, UseOptimisticListResult };
export { useOptimisticList };
