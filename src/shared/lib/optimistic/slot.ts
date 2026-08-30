import { OPTIMISTIC_PERSIST_DEBOUNCE_MS, OPTIMISTIC_STORAGE_KEY } from '@/constants/optimistic';
import type { OptimisticSnapshot } from '@/shared/lib/optimistic/entries';
import {
  hydrateEntries,
  isUnreadableDocument,
  readEntries,
  readScope,
  serializeEntries,
} from '@/shared/lib/optimistic/persistence';

/**
 * The one `localStorage` slot the overlay lives in, and the two window seams
 * around it. Everything about *where* an entry is kept, so the store is left
 * holding only *what* is kept.
 *
 * See docs/features/data-access/store.md.
 */

/** The slice of `Storage` the slot uses, so a test can hand it a fake and a server can hand it nothing. */
interface OptimisticStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface OptimisticSlotOptions {
  /** `null` on the server, and whenever `localStorage` cannot be reached. The slot is then a no-op. */
  storage?: OptimisticStorage | null;

  /** Subscribes to the slot changing in another tab. Returns the unsubscribe. */
  watchExternal?: (onExternalChange: () => void) => () => void;

  /** Subscribes to the page going away, so a debounced write is not lost with it. */
  watchUnload?: (onUnload: () => void) => () => void;

  /** How long a burst of changes is collected before one write. */
  debounceMs?: number;

  /** What to write. Asked at the moment of the write, so the slot holds no copy. */
  entries: () => OptimisticSnapshot;

  /** Another tab wrote the slot. */
  onExternalChange: () => void;
}

interface OptimisticSlot {
  /** The page-load read: whatever was left behind, with what was in flight given up on. */
  hydrate: (at: number) => OptimisticSnapshot;

  /** The cross-tab read: pending means a live request in the tab that wrote it. */
  read: (at: number) => OptimisticSnapshot;

  /** Debounced, so a burst of keystrokes costs one write. */
  schedule: () => void;

  /** Now, not in 200 ms. What a settle takes, so another tab cannot adopt over it. */
  writeNow: () => void;

  /** Empties the slot and drops the debounced write, so nothing is put back after. */
  clear: () => void;

  /**
   * Names whose overlay this is. Answers whether the answer changed, which is
   * what tells the store to read the slot again — and empties the slot first when
   * what is in it belongs to somebody else.
   */
  setScope: (scope: string | null) => boolean;

  /** Whether the slot is still reachable. False once a write was refused. */
  isPersisting: () => boolean;

  /** Gives up both window seams and the pending write. */
  destroy: () => void;
}

/** `localStorage` behind a feature check, because a Server Component imports this module too. */
function browserStorage(): OptimisticStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage: OptimisticStorage | undefined = window.localStorage;

    // Present but unusable is a real browser state — an opaque origin, a sandboxed
    // frame — and reading `null` there is what keeps the store memory-only rather
    // than throwing on the first render.
    return typeof storage?.getItem === 'function' ? storage : null;
  } catch {
    return null;
  }
}

/** The default cross-tab seam: the `storage` event, filtered to our one slot. */
function watchStorageEvent(onExternalChange: () => void): () => void {
  if (typeof globalThis.addEventListener !== 'function') {
    return () => {};
  }

  const listening = new AbortController();

  globalThis.addEventListener(
    'storage',
    (event: Event) => {
      const changedKey = 'key' in event ? event.key : undefined;

      // `null` is the whole of storage being cleared, which is our slot as well.
      if (changedKey === null || changedKey === OPTIMISTIC_STORAGE_KEY) {
        onExternalChange();
      }
    },
    { signal: listening.signal },
  );

  return () => listening.abort();
}

/**
 * The page is going away: `pagehide` fires on a close and on a navigation alike,
 * and a hidden `visibilitychange` covers the mobile app switch, which on iOS is
 * the common way a tab dies without firing `pagehide` at all.
 */
function watchPageHide(onUnload: () => void): () => void {
  if (typeof globalThis.addEventListener !== 'function') {
    return () => {};
  }

  const listening = new AbortController();
  const { signal } = listening;

  globalThis.addEventListener('pagehide', onUnload, { signal });
  globalThis.addEventListener(
    'visibilitychange',
    () => {
      if (globalThis.document?.visibilityState === 'hidden') {
        onUnload();
      }
    },
    { signal },
  );

  return () => listening.abort();
}

/**
 * Builds the slot. Watching starts at construction rather than at the first
 * subscriber: a tab whose route mounts no optimistic component still writes the
 * document whole, and left unwatched it would put its stale snapshot over every
 * other tab's entries.
 */
function createOptimisticSlot(options: OptimisticSlotOptions): OptimisticSlot {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const debounceMs = options.debounceMs ?? OPTIMISTIC_PERSIST_DEBOUNCE_MS;

  /** The unsubscribes for the two window seams, replayed by `destroy`. */
  const teardowns: (() => void)[] = [];

  /** The debounced write's timer handle, and `null` when no write is waiting. */
  let pendingWrite: ReturnType<typeof setTimeout> | null = null;

  /** Whether the slot is still worth writing to. One refusal puts it out of use for good. */
  let canPersist = storage !== null;

  /**
   * Whose overlay this slot reads and writes. `null` until a surface says
   * otherwise, which is why a document written by a signed-in User is not read
   * back until that User is named again.
   */
  let scope: string | null = null;

  function cancelWrite() {
    if (pendingWrite !== null) {
      clearTimeout(pendingWrite);
      pendingWrite = null;
    }
  }

  function clear() {
    cancelWrite();
    storage?.removeItem(OPTIMISTIC_STORAGE_KEY);
  }

  /**
   * A refusal — a quota, a storage the browser has shut off — puts the slot out of
   * use for good rather than throwing again on every later write, and
   * `isPersisting` is how a surface could say so.
   */
  function write() {
    if (storage === null || !canPersist) {
      return;
    }

    try {
      storage.setItem(OPTIMISTIC_STORAGE_KEY, serializeEntries(options.entries(), scope));
    } catch {
      canPersist = false;
    }
  }

  if (storage !== null) {
    // Bytes from a schema this release cannot read are dead weight: every read
    // discards the document whole, and nothing overwrites the slot until this tab
    // happens to write one. Dropped here so it does not hold quota indefinitely.
    if (isUnreadableDocument(storage.getItem(OPTIMISTIC_STORAGE_KEY))) {
      clear();
    }

    teardowns.push((options.watchExternal ?? watchStorageEvent)(options.onExternalChange));

    // The debounce is 200 ms and a closing tab does not wait for it, so the last
    // thing that happened — a failure the User is reading, or the write itself —
    // would be the one thing missing on the page after.
    teardowns.push(
      (options.watchUnload ?? watchPageHide)(() => {
        cancelWrite();
        write();
      }),
    );
  }

  return {
    hydrate: (at) =>
      storage === null ? {} : hydrateEntries(storage.getItem(OPTIMISTIC_STORAGE_KEY), at, scope),

    read: (at) =>
      storage === null ? {} : readEntries(storage.getItem(OPTIMISTIC_STORAGE_KEY), at, scope),

    schedule() {
      if (!canPersist || pendingWrite !== null) {
        return;
      }

      pendingWrite = setTimeout(() => {
        pendingWrite = null;
        write();
      }, debounceMs);
    },

    writeNow() {
      cancelWrite();
      write();
    },

    clear,

    setScope(nextScope) {
      if (nextScope === scope) {
        return false;
      }

      const heldScope =
        storage === null ? null : readScope(storage.getItem(OPTIMISTIC_STORAGE_KEY));

      scope = nextScope;

      // One slot serves the whole browser and it cannot hold two sessions, so an
      // overlay belonging to whoever was here before is dropped rather than left
      // for the next write to overwrite a piece at a time.
      if (heldScope !== nextScope) {
        clear();
      }

      return true;
    },

    isPersisting: () => canPersist,

    destroy() {
      cancelWrite();

      for (const teardown of teardowns.splice(0)) {
        teardown();
      }
    },
  };
}

export type { OptimisticSlot, OptimisticSlotOptions, OptimisticStorage };
export { createOptimisticSlot };
