import { OPTIMISTIC_ENTRY_MAX_AGE_MS, OPTIMISTIC_REQUEST_TIMEOUT_MS } from '@/constants/optimistic';
import { isEntryPending, type OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { interruptEntry } from '@/shared/lib/optimistic/transitions';

/**
 * Every key's entry at once. What the store holds and `useSyncExternalStore`
 * reads: replaced wholesale, never mutated, so a snapshot compares by reference.
 */
type OptimisticSnapshot = Readonly<Record<string, OptimisticEntry>>;

/**
 * The moves that are about the collection rather than about one entry — expiry,
 * the deadline, and the cross-tab merge. Pure, so the store is state and
 * subscription and nothing else.
 *
 * See docs/features/data-access/store.md.
 */

/**
 * Whether two snapshots say the same thing. Entries are replaced and never
 * mutated, so identity per key is the whole comparison — and it is what keeps a
 * cross-tab read that changed nothing from re-rendering every subscriber.
 */
function isSameSnapshot(left: OptimisticSnapshot, right: OptimisticSnapshot): boolean {
  if (left === right) {
    return true;
  }

  const keys = Object.keys(left);

  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

/**
 * One entry measured against the clock. Past its age it is gone; past the request
 * deadline while still in flight it becomes a failure nobody knows the end of,
 * because a request nobody answers would hold the row dim for the life of the tab.
 */
function sweepEntry(entry: OptimisticEntry, at: number): OptimisticEntry | null {
  if (at - entry.touchedAt > OPTIMISTIC_ENTRY_MAX_AGE_MS) {
    return null;
  }

  return isEntryPending(entry) && at - entry.touchedAt > OPTIMISTIC_REQUEST_TIMEOUT_MS
    ? interruptEntry(entry, at)
    : entry;
}

/**
 * The collection with everything the clock has settled taken out. Answers the
 * same object when nothing changed, so a sweep on every write costs one pass and
 * no render.
 *
 * Run on every change rather than only on a page load: a tab left open is where
 * an entry nobody came back to would otherwise sit forever, since a refused write
 * is never superseded by a render and only a dismissal ends one.
 */
function sweepEntries(entries: OptimisticSnapshot, at: number): OptimisticSnapshot {
  let swept: Record<string, OptimisticEntry> | null = null;

  for (const [key, entry] of Object.entries(entries)) {
    const next = sweepEntry(entry, at);

    if (next === entry) {
      continue;
    }

    swept ??= { ...entries };

    if (next === null) {
      delete swept[key];
    } else {
      swept[key] = next;
    }
  }

  return swept ?? entries;
}

/**
 * Whether any key has a write out. What a global indicator reads, so a surface
 * asking "is anything syncing" does not iterate the snapshot itself.
 */
function hasPendingEntry(entries: OptimisticSnapshot): boolean {
  return Object.values(entries).some(isEntryPending);
}

/**
 * When the next write runs out of time, and `null` when none is in flight. What
 * arms the store's timer: a write this tab issued carries its own deadline in
 * `runOptimistic`, but one adopted from a tab that has since died carries none,
 * and nothing else would ever take it off the screen.
 */
function nextDeadline(entries: OptimisticSnapshot): number | null {
  let soonest: number | null = null;

  for (const entry of Object.values(entries)) {
    if (!isEntryPending(entry)) {
      continue;
    }

    const due = entry.touchedAt + OPTIMISTIC_REQUEST_TIMEOUT_MS;

    if (soonest === null || due < soonest) {
      soonest = due;
    }
  }

  return soonest;
}

/**
 * Adopts what another tab wrote. Its document is the authority on everything this
 * tab is not in the middle of writing — but a key with a write in flight *here*
 * is this tab's, and the other tab had no way to know about it, so taking the
 * document wholesale would drop the write and discard its answer in silence.
 *
 * `isMine` is asked rather than `isEntryPending`: a pending entry adopted from
 * another tab looks exactly like one of ours, and keeping it would make this tab
 * ignore the very document that settles it.
 *
 * `latestCall` never travels in the document — it is each tab's own counter — so
 * the local number is carried over rather than restarted, or a superseded answer
 * would land as the current one.
 */
function mergeExternal(
  local: OptimisticSnapshot,
  external: OptimisticSnapshot,
  isMine: (key: string) => boolean,
): OptimisticSnapshot {
  const merged: Record<string, OptimisticEntry> = {};

  for (const [key, entry] of Object.entries(external)) {
    const localCall = local[key]?.latestCall ?? 0;

    merged[key] = localCall > entry.latestCall ? { ...entry, latestCall: localCall } : entry;
  }

  for (const [key, entry] of Object.entries(local)) {
    if (isMine(key)) {
      merged[key] = entry;
    }
  }

  return merged;
}

export type { OptimisticSnapshot };
export { hasPendingEntry, isSameSnapshot, mergeExternal, nextDeadline, sweepEntries };
