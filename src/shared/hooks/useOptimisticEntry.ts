'use client';

import { useSyncExternalStore } from 'react';

import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';
import type { OptimisticSnapshot } from '@/shared/lib/optimistic/entries';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';

/**
 * Every key's entry, as React reads it. One subscription rather than one per key:
 * the snapshot is replaced wholesale, so a hook comparing its own key is cheaper
 * than a listener per row.
 *
 * The server snapshot is empty, and stays empty through hydration: the store has
 * already read `localStorage` by then, so answering it there would disagree with
 * the HTML that arrived. The overlay lands on the render after instead.
 */
function useOptimisticSnapshot(): OptimisticSnapshot {
  const store = useOptimisticStore();

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/** One key's entry, for a component that only displays what is different from the server. */
function useOptimisticEntry(key: string): OptimisticEntry | null {
  return useOptimisticSnapshot()[key] ?? null;
}

export { useOptimisticEntry, useOptimisticSnapshot };
