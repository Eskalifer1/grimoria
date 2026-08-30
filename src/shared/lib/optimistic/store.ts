import { nextCall, ownedByCall } from '@/shared/lib/optimistic/calls';
import {
  isSameSnapshot,
  mergeExternal,
  nextDeadline,
  type OptimisticSnapshot,
  sweepEntries,
} from '@/shared/lib/optimistic/entries';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import {
  createOptimisticSlot,
  type OptimisticSlotOptions,
  type OptimisticStorage,
} from '@/shared/lib/optimistic/slot';
import {
  type BeginEntryInput,
  beginEntry,
  dismissEntry,
  reconcileEntry,
  type SettleFailureInput,
  type SettleSuccessInput,
  settleFailureEntry,
  settleSuccessEntry,
} from '@/shared/lib/optimistic/transitions';

interface OptimisticStoreOptions extends Pick<OptimisticSlotOptions, 'storage'> {
  /** Subscribes to the slot changing in another tab. Returns the unsubscribe. */
  watchExternal?: OptimisticSlotOptions['watchExternal'];

  /** Subscribes to the page going away, so a debounced write is not lost with it. */
  watchUnload?: OptimisticSlotOptions['watchUnload'];

  /** The clock, so a test can settle an entry at a moment it chooses. */
  now?: () => number;

  /** How long a burst of changes is collected before one `localStorage` write. */
  debounceMs?: number;
}

interface OptimisticStore {
  /** Opens a write and answers its call number, which the matching settle must carry. */
  begin: (key: string, input: BeginEntryInput) => number;

  settleSuccess: (key: string, call: number, input?: SettleSuccessInput) => void;
  settleFailure: (key: string, call: number, input: SettleFailureInput) => void;

  /** Throws an attempt away: its errors and the value they belong to. */
  dismiss: (key: string, field?: string) => void;

  /** Tells the store which version the server just rendered, so a caught-up entry can die. */
  reconcile: (key: string, serverVersion: string | null) => void;

  /**
   * Names whose overlay this is — a User id, or `null` for nobody signed in.
   * One `localStorage` slot serves the whole browser, so an overlay left by
   * somebody else is dropped rather than rendered to the next User on the same
   * machine. Synchronous, and a no-op when the scope has not changed.
   */
  setScope: (scope: string | null) => void;

  /** The sign-in and sign-out wipe. Synchronous, so no entry survives into another session. */
  clearAll: () => void;

  /** Whether the overlay is still reaching `localStorage`. False once a write was refused. */
  isPersisting: () => boolean;

  getEntry: (key: string) => OptimisticEntry | null;
  getSnapshot: () => OptimisticSnapshot;

  /**
   * What the server rendered: nothing. React reads this during hydration as well,
   * so answering the persisted entry here would disagree with the HTML that
   * arrived and tear the tree — the overlay arrives on the render after instead.
   */
  getServerSnapshot: () => OptimisticSnapshot;
  subscribe: (listener: () => void) => () => void;

  /**
   * Gives up the window listeners, the pending write and the sweep timer. The
   * app's singleton lives as long as the tab, so this is for a store a test built
   * through the factory — left behind, each one keeps answering `storage` events
   * for the whole run.
   */
  destroy: () => void;
}

const EMPTY_SNAPSHOT: OptimisticSnapshot = {};

/**
 * The optimistic store: what is different from the server, per key, and why
 * (ADR-0011). The keyed state, the subscription, and the verbs — the slot it is
 * persisted through is `slot.ts`, the moves an entry makes are
 * `transitions.ts`, and which answer is still current is
 * `calls.ts`.
 *
 * A plain module with no React in it — the `useSyncExternalStore` binding is a
 * hook of its own. Built through a factory so a test gets a store with its
 * storage and its clock injected rather than a shared singleton.
 *
 * See docs/features/data-access/store.md.
 */
function createOptimisticStore(options: OptimisticStoreOptions = {}): OptimisticStore {
  const now = options.now ?? Date.now;
  const listeners = new Set<() => void>();

  /**
   * The keys this tab has a write out on. What tells one of our pending entries
   * from one adopted out of another tab's document, which looks identical — kept
   * as ours, the adopted one would make this tab ignore the very document that
   * settles it.
   */
  const ownWrites = new Set<string>();

  /** The published state: every key's entry, replaced wholesale and never mutated. */
  let snapshot: OptimisticSnapshot = EMPTY_SNAPSHOT;

  /**
   * The highest call number this store has handed out. Held by the store rather
   * than by an entry, and never reset — `clearAll` included. Numbered per entry it
   * would restart whenever an entry died, and a request still in flight against
   * the old entry would come back carrying a number the new one accepts as its own.
   */
  let issuedCalls = 0;

  /**
   * The one timer that expires entries: armed for the moment the soonest write
   * runs out of time, and `null` when none is in flight. A handle, not a moment —
   * the moment it is armed for is `nextDeadline(snapshot)`.
   */
  let sweepTimer: ReturnType<typeof setTimeout> | null = null;

  const slot = createOptimisticSlot({
    storage: options.storage,
    watchExternal: options.watchExternal,
    watchUnload: options.watchUnload,
    debounceMs: options.debounceMs,
    entries: () => snapshot,
    onExternalChange: adoptExternal,
  });

  function clearSweep() {
    if (sweepTimer !== null) {
      clearTimeout(sweepTimer);
      sweepTimer = null;
    }
  }

  /**
   * Arms one timer at the moment the next write runs out of time. A write this tab
   * issued carries its own deadline in `runOptimistic`; one adopted from a tab
   * that has since died carries none, and without this it stays dim for the life
   * of the tab.
   */
  function armSweep() {
    clearSweep();

    const dueAt = nextDeadline(snapshot);

    if (dueAt === null) {
      return;
    }

    sweepTimer = setTimeout(
      () => {
        sweepTimer = null;

        if (publish(sweepEntries(snapshot, now()))) {
          slot.schedule();
        }
      },
      Math.max(0, dueAt - now()),
    );
  }

  /** Publishes a snapshot to the subscribers. Answers whether anything actually changed. */
  function publish(next: OptimisticSnapshot): boolean {
    if (isSameSnapshot(next, snapshot)) {
      return false;
    }

    snapshot = next;

    for (const key of ownWrites) {
      const entry = snapshot[key];

      if (!entry?.pendingAction && !Object.keys(entry?.pendingFields ?? {}).length) {
        ownWrites.delete(key);
      }
    }

    armSweep();

    for (const listener of listeners) {
      listener();
    }

    return true;
  }

  /**
   * Reads a key, applies a transition to it, and publishes the result — `null`
   * deletes the key, and the same entry back changes nothing. Every verb is this
   * with a different transition, so the sweep and the persistence are written once.
   *
   * `isUrgent` is what a settle takes: the reason and the value it explains are
   * what the User is reading when the tab dies or another tab writes the slot,
   * and neither waits 200 ms.
   */
  function update(
    key: string,
    transition: (entry: OptimisticEntry | null, at: number) => OptimisticEntry | null,
    isUrgent = false,
  ): boolean {
    const at = now();
    const swept = sweepEntries(snapshot, at);
    const existing = swept[key] ?? null;
    const transitioned = transition(existing, at);

    if (swept === snapshot && transitioned === existing) {
      return false;
    }

    const next = { ...swept };

    if (transitioned === null) {
      delete next[key];
    } else {
      next[key] = transitioned;
    }

    if (!publish(next)) {
      return false;
    }

    if (isUrgent) {
      slot.writeNow();
    } else {
      slot.schedule();
    }

    return true;
  }

  /** Adopts what another tab wrote, keeping the keys this tab is in the middle of writing. */
  function adoptExternal() {
    const at = now();

    publish(
      sweepEntries(
        mergeExternal(snapshot, slot.read(at), (key) => ownWrites.has(key)),
        at,
      ),
    );
  }

  snapshot = sweepEntries(slot.hydrate(now()), now());
  armSweep();

  return {
    begin(key, input) {
      issuedCalls = nextCall(issuedCalls, snapshot[key]?.latestCall);

      const call = issuedCalls;

      update(key, (entry, at) => beginEntry(entry, input, call, at));
      ownWrites.add(key);

      return call;
    },

    settleSuccess(key, call, input = {}) {
      update(
        key,
        (entry, at) => {
          if (!entry) {
            return null;
          }

          const ownership = ownedByCall(entry, call, input.fields);

          return ownership ? settleSuccessEntry(entry, { ...input, ...ownership }, at) : entry;
        },
        true,
      );
    },

    settleFailure(key, call, input) {
      update(
        key,
        (entry, at) => {
          if (!entry) {
            return null;
          }

          const ownership = ownedByCall(entry, call, input.fields);

          return ownership
            ? settleFailureEntry(entry, { ...input, ...ownership }, call, at)
            : entry;
        },
        true,
      );
    },

    dismiss(key, field) {
      update(key, (entry) => (entry ? dismissEntry(entry, field) : null));
    },

    reconcile(key, serverVersion) {
      update(key, (entry) => (entry ? reconcileEntry(entry, serverVersion) : null));
    },

    setScope(scope) {
      if (!slot.setScope(scope)) {
        return;
      }

      // Whatever was out belonged to the session that is ending, and its answer
      // has no entry left to settle against.
      ownWrites.clear();
      publish(sweepEntries(slot.hydrate(now()), now()));
    },

    clearAll() {
      slot.clear();
      ownWrites.clear();
      publish(EMPTY_SNAPSHOT);
    },

    isPersisting: slot.isPersisting,
    getEntry: (key) => snapshot[key] ?? null,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY_SNAPSHOT,

    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },

    destroy() {
      clearSweep();
      slot.destroy();
      listeners.clear();
    },
  };
}

/** The one store the app reads. A test builds its own through the factory instead. */
const optimisticStore = createOptimisticStore();

export type { OptimisticSnapshot, OptimisticStorage, OptimisticStore, OptimisticStoreOptions };
export { createOptimisticStore, optimisticStore };
