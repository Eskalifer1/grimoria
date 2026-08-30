import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import {
  OPTIMISTIC_ENTRY_MAX_AGE_MS,
  OPTIMISTIC_ERROR,
  OPTIMISTIC_PERSIST_DEBOUNCE_MS,
  OPTIMISTIC_REQUEST_TIMEOUT_MS,
  OPTIMISTIC_STORAGE_KEY,
  PENDING_ACTION,
} from '@/constants/optimistic';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { serializeEntries } from '@/shared/lib/optimistic/persistence';
import {
  createOptimisticStore,
  type OptimisticStorage,
  optimisticStore,
} from '@/shared/lib/optimistic/store';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

/** The call a failure is filed under. Tests that do not correlate two of them share one. */
const ATTEMPT = 1;

const KEY = 'note:9f2c';
const NOW = 1_700_000_000_000;

/** A `localStorage` stand-in with the two failure modes the store has to survive. */
function fakeStorage(seed: string | null = null): OptimisticStorage & { throwOnWrite: boolean } {
  let value = seed;

  return {
    throwOnWrite: false,
    getItem: (key) => (key === OPTIMISTIC_STORAGE_KEY ? value : null),
    setItem(key, next) {
      if (this.throwOnWrite) {
        throw new Error('QuotaExceededError');
      }

      if (key === OPTIMISTIC_STORAGE_KEY) {
        value = next;
      }
    },
    removeItem: (key) => {
      if (key === OPTIMISTIC_STORAGE_KEY) {
        value = null;
      }
    },
  };
}

/** A settled failure belonging to some other key, for a document this tab did not write. */
function failedEntry() {
  return refused(
    beginEntry(null, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'X' } }, 1, NOW),
    { error: { code: ACTION_ERROR.CONFLICT } },
    ATTEMPT,
    NOW,
  );
}

/** A failure that left something behind, narrowed for the callers that store it. */
function refused(
  entry: OptimisticEntry,
  input: Parameters<typeof settleFailureEntry>[1],
  call: number,
  at: number,
): OptimisticEntry {
  const settled = settleFailureEntry(entry, input, call, at);

  if (settled === null) {
    throw new Error('the failure left nothing behind');
  }

  return settled;
}

function makeStore(storage: OptimisticStorage = fakeStorage()) {
  return createOptimisticStore({ storage, now: () => NOW });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the store surface', () => {
  it('ships a singleton beside the factory', () => {
    expect(typeof optimisticStore.begin).toBe('function');
    expect(typeof optimisticStore.subscribe).toBe('function');
  });

  it('is pure of React', async () => {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile('src/shared/lib/optimistic/store.ts', 'utf8'),
    );

    expect(source).not.toMatch(/from 'react/);
    expect(source).not.toContain('use client');
  });
});

describe('begin', () => {
  it('numbers each call to a key, and shows the patch at once', () => {
    const store = makeStore();

    expect(
      store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } }),
    ).toBe(1);
    expect(
      store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } }),
    ).toBe(2);
    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'B' });
  });

  it('never hands out a number twice, whichever key asked', () => {
    const store = makeStore();

    const first = store.begin(KEY, { action: PENDING_ACTION.UPDATE });
    const second = store.begin('user:1', { action: PENDING_ACTION.UPDATE });

    expect(second).toBeGreaterThan(first);
  });

  it('keeps counting past a wipe, so a call still in flight cannot be mistaken for the next', () => {
    const store = makeStore();
    const stale = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Abandoned' },
    });

    store.clearAll();

    const current = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Wanted' },
    });

    // The wiped request answers late; numbered from zero again it would settle
    // the write that replaced it.
    store.settleSuccess(KEY, stale, { serverData: { title: 'Abandoned' } });

    expect(current).toBeGreaterThan(stale);
    expect(store.getEntry(KEY)?.patch.title).toBe('Wanted');
  });
});

describe('settleSuccess', () => {
  it("writes the server's response into the patch", () => {
    const store = makeStore();
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleSuccess(KEY, call, { serverData: { title: 'A2' } });

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'A2' });
    expect(store.getEntry(KEY)?.pendingAction).toBeNull();
  });

  it('does nothing on a key with no entry', () => {
    const store = makeStore();

    store.settleSuccess(KEY, 1, { serverData: { title: 'A2' } });

    expect(store.getEntry(KEY)).toBeNull();
  });

  it('changes nothing at all when the call number is behind the latest', () => {
    const store = makeStore();
    const first = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });

    const before = store.getEntry(KEY);

    store.settleSuccess(KEY, first, { serverData: { title: 'A2' } });

    expect(store.getEntry(KEY)).toBe(before);
  });
});

describe('settleFailure', () => {
  it('records the code and leaves the optimistic value on screen', () => {
    const store = makeStore();
    const call = store.begin(KEY, { action: PENDING_ACTION.ADD, optimisticData: { title: 'A' } });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.UNEXPECTED } });

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'A' });
    expect(store.getEntry(KEY)?.error).toMatchObject({
      code: ACTION_ERROR.UNEXPECTED,
      fields: null,
    });
  });

  it('rolls back when failureData carries the previous value', () => {
    const store = makeStore();
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleFailure(KEY, call, {
      error: { code: ACTION_ERROR.UNEXPECTED },
      failureData: { title: 'Server' },
    });

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'Server' });
  });

  it('changes nothing at all when the call number is behind the latest', () => {
    const store = makeStore();
    const first = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });

    const before = store.getEntry(KEY);

    store.settleFailure(KEY, first, { error: { code: ACTION_ERROR.UNEXPECTED } });

    expect(store.getEntry(KEY)).toBe(before);
  });

  it('does nothing on a key with no entry', () => {
    const store = makeStore();

    store.settleFailure(KEY, 1, { error: { code: ACTION_ERROR.UNEXPECTED } });

    expect(store.getEntry(KEY)).toBeNull();
  });
});

describe('dismiss', () => {
  it('drops a failed entry whole', () => {
    const store = makeStore();
    const call = store.begin(KEY, { action: PENDING_ACTION.ADD, optimisticData: { title: 'A' } });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.UNEXPECTED } });
    store.dismiss(KEY);

    expect(store.getEntry(KEY)).toBeNull();
  });

  it('is a no-op the second time, and on a key with no entry', () => {
    const store = makeStore();
    const listener = vi.fn();

    store.subscribe(listener);
    store.dismiss(KEY);
    store.dismiss('user:none');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('reconcile', () => {
  it('drops the entry once the server render catches up', () => {
    const store = makeStore();
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
      sourceVersion: 'v1',
    });

    store.settleSuccess(KEY, call, { serverData: { title: 'A2' }, serverVersion: 'v2' });
    store.reconcile(KEY, 'v2');

    expect(store.getEntry(KEY)).toBeNull();
  });

  it('does not resurrect an entry that is already gone', () => {
    const store = makeStore();

    store.reconcile(KEY, 'v0');

    expect(store.getEntry(KEY)).toBeNull();
    expect(store.getSnapshot()).toEqual({});
  });
});

describe('getEntry and getSnapshot', () => {
  it('answers null for a key nothing is stored under', () => {
    expect(makeStore().getEntry('note:nothing')).toBeNull();
  });

  it('hands out the same snapshot until something changes', () => {
    const store = makeStore();
    const before = store.getSnapshot();

    expect(store.getSnapshot()).toBe(before);

    store.begin(KEY, { action: PENDING_ACTION.UPDATE });

    expect(store.getSnapshot()).not.toBe(before);
  });
});

describe('getServerSnapshot', () => {
  it('is empty however much the client store holds', () => {
    const store = makeStore();

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });

    // React reads this one during hydration too. Answering the persisted entry
    // there would disagree with the HTML the server sent and tear the tree.
    expect(store.getServerSnapshot()).toEqual({});
    expect(store.getSnapshot()).not.toEqual({});
  });
});

describe('subscribe', () => {
  it('notifies on a change and stops on unsubscribe', () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.begin(KEY, { action: PENDING_ACTION.UPDATE });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.begin(KEY, { action: PENDING_ACTION.UPDATE });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('persistence', () => {
  it('writes the whole document once, debounced', () => {
    const storage = fakeStorage();
    const setItem = vi.spyOn(storage, 'setItem');
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });

    expect(setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toContain('"title":"B"');
  });

  it('reads what a previous page left behind, turning what was in flight into a failure', () => {
    const seeded = serializeEntries({
      [KEY]: beginEntry(
        null,
        { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } },
        1,
        NOW,
      ),
    });

    const store = createOptimisticStore({ storage: fakeStorage(seeded), now: () => NOW });

    expect(store.getEntry(KEY)?.pendingAction).toBeNull();
    expect(store.getEntry(KEY)?.error).toMatchObject({
      code: OPTIMISTIC_ERROR.INTERRUPTED,
      fields: null,
    });
  });

  it('drops a document from another schema version instead of leaving it in the slot', () => {
    const stale = JSON.stringify({ version: -1, scope: null, entries: { [KEY]: {} } });
    const storage = fakeStorage(stale);

    createOptimisticStore({ storage, now: () => NOW });

    // Every read discards it whole, so left in place it would hold quota for the
    // life of the browser without a single page ever showing it.
    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
  });

  it('drops bytes that are not a document at all', () => {
    const storage = fakeStorage('} not json {');

    createOptimisticStore({ storage, now: () => NOW });

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
  });

  it('keeps a readable document written under another scope, which is setScope to decide', () => {
    const seeded = serializeEntries({ [KEY]: failedEntry() }, 'user-1');
    const storage = fakeStorage(seeded);

    createOptimisticStore({ storage, now: () => NOW });

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBe(seeded);
  });

  it('rebuilds a refused write, value and reason, on the page after the reload', () => {
    const storage = fakeStorage();
    const first = createOptimisticStore({ storage, now: () => NOW });
    const call = first.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    first.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    // A second store over the same slot is what a reload is: the entry crosses
    // as JSON, not as the object the first store happened to hold.
    const reloaded = createOptimisticStore({ storage, now: () => NOW });

    expect(reloaded.getEntry(KEY)?.patch).toEqual({ title: 'A' });
    expect(reloaded.getEntry(KEY)?.error).toMatchObject({
      code: ACTION_ERROR.CONFLICT,
      fields: null,
    });
  });

  it('keeps working in memory when the write throws', () => {
    const storage = fakeStorage();

    storage.throwOnWrite = true;

    const store = createOptimisticStore({ storage, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });

    expect(() => vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS)).not.toThrow();
    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'A' });
  });

  it('works with no storage at all', () => {
    const store = createOptimisticStore({ storage: null, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });

    expect(() => vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS)).not.toThrow();
    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'A' });
  });
});

describe('clearAll', () => {
  it('empties the slot synchronously, before anything can await', () => {
    const storage = fakeStorage();
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    store.clearAll();

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
    expect(store.getSnapshot()).toEqual({});
  });

  it('cancels a debounced write, so nothing is rewritten after the wipe', () => {
    const storage = fakeStorage();
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    store.clearAll();
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers', () => {
    const store = makeStore();
    const listener = vi.fn();

    store.begin(KEY, { action: PENDING_ACTION.UPDATE });
    store.subscribe(listener);
    store.clearAll();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('the page going away', () => {
  it('writes the debounced document immediately, before the tab can take it', () => {
    const storage = fakeStorage();
    let leave = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchUnload: (onUnload) => {
        leave = onUnload;

        return () => {};
      },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } });

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();

    leave();

    // Closed inside the debounce window, the write is lost whole: the value and
    // the fact that anything was ever sent both go.
    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toContain('"title":"Typed"');
  });

  it('writes a failure the User was looking at, not the pending state before it', () => {
    const storage = fakeStorage();
    let leave = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchUnload: (onUnload) => {
        leave = onUnload;

        return () => {};
      },
    });
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);
    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });
    leave();

    const restored = createOptimisticStore({ storage, now: () => NOW });

    expect(restored.getEntry(KEY)?.error).toMatchObject({
      code: ACTION_ERROR.CONFLICT,
      fields: null,
    });
  });
});

describe('destroy', () => {
  it('gives up both window seams, so a store nobody holds stops listening', () => {
    const unwatchExternal = vi.fn();
    const unwatchUnload = vi.fn();
    const store = createOptimisticStore({
      storage: fakeStorage(),
      now: () => NOW,
      watchExternal: () => unwatchExternal,
      watchUnload: () => unwatchUnload,
    });

    store.destroy();

    // Left behind, every store a test builds keeps answering `storage` events
    // for the rest of the run, and the singleton is not the only one listening.
    expect(unwatchExternal).toHaveBeenCalledOnce();
    expect(unwatchUnload).toHaveBeenCalledOnce();
  });

  it('stops answering the subscribers it had', () => {
    const store = createOptimisticStore({ storage: fakeStorage(), now: () => NOW });
    const listener = vi.fn();

    store.subscribe(listener);
    store.destroy();
    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });

    expect(listener).not.toHaveBeenCalled();
  });

  it('drops a debounced write rather than letting it land after the teardown', () => {
    const storage = fakeStorage();
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    store.destroy();
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
  });
});

describe('a storage that refuses', () => {
  it('stops trying, and says it is no longer persisting', () => {
    const storage = fakeStorage();
    const setItem = vi.spyOn(storage, 'setItem');
    const store = createOptimisticStore({ storage, now: () => NOW });

    storage.throwOnWrite = true;
    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    expect(store.isPersisting()).toBe(false);

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });
    vi.advanceTimersByTime(OPTIMISTIC_PERSIST_DEBOUNCE_MS);

    // Every later write threw too, because the failure was swallowed and nothing
    // recorded it. The overlay is memory-only from here and says so.
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'B' });
  });

  it('is persisting while the storage takes writes', () => {
    const store = makeStore();

    expect(store.isPersisting()).toBe(true);
  });

  it('is not persisting when there is no storage at all', () => {
    expect(createOptimisticStore({ storage: null }).isPersisting()).toBe(false);
  });
});

describe('another tab', () => {
  it('re-reads the slot and reports the change through getSnapshot', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {
          notify = () => {};
        };
      },
    });
    const listener = vi.fn();

    store.subscribe(listener);

    storage.setItem(
      OPTIMISTIC_STORAGE_KEY,
      serializeEntries({
        [KEY]: beginEntry(null, { action: PENDING_ACTION.UPDATE }, 1, NOW),
      }),
    );
    notify();

    expect(store.getEntry(KEY)).not.toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps a write this tab has in flight, which the other tab could not know about', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } });
    // The other tab flushed before this tab's debounce, so its document says
    // nothing about this key. Adopting it wholesale would take the write away.
    storage.setItem(OPTIMISTIC_STORAGE_KEY, serializeEntries({ 'note:other': failedEntry() }));
    notify();

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'Typed' });
    expect(store.getEntry(KEY)?.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(store.getEntry('note:other')).not.toBeNull();
  });

  it('ends a write it adopts that is already past the deadline', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });

    // The tab that issued it is gone: it persisted the entry still in flight, and
    // interruption only happens on that tab's next load, which may never come.
    // Adopted as it stands, the row here is dimmed and busy for good — no answer
    // was ever addressed to this tab, and `reconcile` will not touch a pending entry.
    storage.setItem(
      OPTIMISTIC_STORAGE_KEY,
      serializeEntries({
        [KEY]: beginEntry(
          null,
          { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } },
          1,
          NOW - OPTIMISTIC_REQUEST_TIMEOUT_MS - 1,
        ),
      }),
    );
    notify();

    expect(store.getEntry(KEY)?.pendingAction).toBeNull();
    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'Typed' });
  });

  it('leaves another tab\u2019s live write pending rather than calling it interrupted', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });

    storage.setItem(
      OPTIMISTIC_STORAGE_KEY,
      serializeEntries({ [KEY]: beginEntry(null, { action: PENDING_ACTION.UPDATE }, 1, NOW) }),
    );
    notify();

    // Pending in the slot means another tab is writing, not that a page died.
    expect(store.getEntry(KEY)?.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(store.getEntry(KEY)?.error).toBeNull();
  });

  it('keeps its own call numbering, which never travels in the document', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    const second = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'B' },
    });

    storage.setItem(OPTIMISTIC_STORAGE_KEY, serializeEntries({ 'note:other': failedEntry() }));
    notify();

    // Reset to zero here and the first call's answer would be accepted as current,
    // showing a superseded value as saved while the second call is still out.
    expect(store.getEntry(KEY)?.latestCall).toBe(second);

    store.settleSuccess(KEY, 1, { serverData: { title: 'A' } });

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'B' });
    expect(store.getEntry(KEY)?.pendingAction).toBe(PENDING_ACTION.UPDATE);
  });

  it('still adopts a dismissal, because a settled entry is the other tab\u2019s to end', () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });
    storage.setItem(OPTIMISTIC_STORAGE_KEY, serializeEntries({}));
    notify();

    expect(store.getEntry(KEY)).toBeNull();
  });

  it('watches from the moment it is built, so a tab with nothing mounted stays current', () => {
    const unwatch = vi.fn();
    const watchExternal = vi.fn(() => unwatch);

    createOptimisticStore({ storage: fakeStorage(), now: () => NOW, watchExternal });

    // A tab whose route mounts no optimistic component still writes the document
    // whole. Left unwatched it would write a stale snapshot over every other tab.
    expect(watchExternal).toHaveBeenCalledTimes(1);
  });

  it('skips watching when there is no storage to watch', () => {
    const watchExternal = vi.fn(() => vi.fn());

    createOptimisticStore({ storage: null, watchExternal });

    expect(watchExternal).not.toHaveBeenCalled();
  });
});

describe('two writes on one key', () => {
  /** Opens a write on one field and answers the call number it was given. */
  function beginField(store: ReturnType<typeof makeStore>, field: string) {
    return store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { [field]: 'x' } });
  }

  it('settles each field on its own answer, not on the last one opened', () => {
    const store = makeStore();
    const title = beginField(store, 'title');

    beginField(store, 'body');
    store.settleFailure(KEY, title, {
      error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['too long'] } },
      fields: ['title'],
    });

    // A key is one record and a write is one field of it. Measured against the
    // key, the second field opening a write makes the first field's answer look
    // stale — and the User is left reading a value the server refused, unmarked.
    expect(store.getEntry(KEY)?.error).not.toEqual({});
  });

  it('leaves a field still in flight marked when another field answers', () => {
    const store = makeStore();
    const title = beginField(store, 'title');

    beginField(store, 'body');
    store.settleSuccess(KEY, title, { fields: ['title'] });

    const entry = store.getEntry(KEY);

    expect(entry?.pendingFields).toEqual({ body: PENDING_ACTION.UPDATE });
    expect(entry?.pendingAction).toBe(PENDING_ACTION.UPDATE);
  });

  it('leaves another field\u2019s failure standing when this one lands', () => {
    const store = makeStore();
    const title = beginField(store, 'title');
    const body = beginField(store, 'body');

    store.settleFailure(KEY, title, { error: { code: ACTION_ERROR.CONFLICT }, fields: ['title'] });
    store.settleSuccess(KEY, body, { fields: ['body'] });

    // The body's answer says nothing about the title, and taking the title's
    // reason off screen leaves the User with a refused value and no message.
    expect(store.getEntry(KEY)?.error).not.toEqual({});
  });

  it('still discards the older of two answers on the same field', () => {
    const store = makeStore();
    const first = beginField(store, 'title');
    const second = beginField(store, 'title');

    store.settleSuccess(KEY, second, { serverData: { title: 'second' }, fields: ['title'] });
    store.settleSuccess(KEY, first, { serverData: { title: 'first' }, fields: ['title'] });

    expect(store.getEntry(KEY)?.patch).toEqual({ title: 'second' });
  });
});

describe('a settled write and the slot', () => {
  it('reaches storage without waiting for the debounce', () => {
    const storage = fakeStorage();
    const store = createOptimisticStore({ storage, now: () => NOW });
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'X' },
    });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT }, fields: ['title'] });

    // The reason and the value it explains are what the User is reading when the
    // tab dies or another tab writes the slot. Neither waits 200 ms.
    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toContain(ACTION_ERROR.CONFLICT);
  });
});

describe('a write another write overtook', () => {
  it('settles the half of it nobody took, and writes none of the half they did', () => {
    const store = makeStore();
    const wide = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A', body: 'A' },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });
    store.settleSuccess(KEY, wide, {
      serverData: { title: 'A', body: 'A' },
      fields: ['title', 'body'],
    });

    const entry = store.getEntry(KEY);

    // `body` was still the older write's and settles. `title` is not, and writing
    // it would put back the value the User has already replaced.
    expect(entry?.patch).toEqual({ title: 'B', body: 'A' });
    expect(entry?.pendingFields).toEqual({ title: PENDING_ACTION.UPDATE });
  });

  it('files a refusal against the fields it still owns and no others', () => {
    const store = makeStore();
    const wide = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A', body: 'A' },
    });

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });
    store.settleFailure(KEY, wide, {
      error: { code: ACTION_ERROR.CONFLICT },
      fields: ['title', 'body'],
    });

    const entry = store.getEntry(KEY);

    expect(entry?.fieldErrors.body).toBeDefined();
    expect(entry?.fieldErrors.title).toBeUndefined();
    expect(entry?.pendingFields.title).toBe(PENDING_ACTION.UPDATE);
  });
});

describe('the clock', () => {
  /** A store whose clock the test moves, so an entry can be aged without waiting. */
  function makeTimedStore(storage: OptimisticStorage = fakeStorage()) {
    let at = NOW;
    const store = createOptimisticStore({ storage, now: () => at });

    return {
      store,
      travel(ms: number) {
        at += ms;
        vi.advanceTimersByTime(ms);
      },
    };
  }

  it('gives up on a write nobody answered, without another event to prompt it', () => {
    const { store, travel } = makeTimedStore();

    store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'A' } });
    travel(OPTIMISTIC_REQUEST_TIMEOUT_MS + 1);

    // A write this tab issued carries its own deadline in `runOptimistic`. One
    // adopted from a tab that has since died carries none, and without this it
    // stays dim for the life of the tab.
    expect(store.getEntry(KEY)?.pendingAction).toBeNull();
    expect(store.getEntry(KEY)?.error?.code).toBe(OPTIMISTIC_ERROR.INTERRUPTED);
  });

  it('drops an entry nobody came back to, rather than holding it for the life of the tab', () => {
    const { store, travel } = makeTimedStore();
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });
    travel(OPTIMISTIC_ENTRY_MAX_AGE_MS + 1);
    store.begin('note:other', { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'B' } });

    expect(store.getEntry(KEY)).toBeNull();
  });
});

describe('a pending entry read out of the slot', () => {
  it("takes the other tab's settle rather than holding its own copy of the write", () => {
    const storage = fakeStorage();
    let notify = () => {};
    const store = createOptimisticStore({
      storage,
      now: () => NOW,
      watchExternal: (onChange) => {
        notify = onChange;

        return () => {};
      },
    });
    const inFlight = beginEntry(
      null,
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } },
      1,
      NOW,
    );

    storage.setItem(OPTIMISTIC_STORAGE_KEY, serializeEntries({ [KEY]: inFlight }));
    notify();
    expect(store.getEntry(KEY)?.pendingAction).toBe(PENDING_ACTION.UPDATE);

    storage.setItem(
      OPTIMISTIC_STORAGE_KEY,
      serializeEntries({
        [KEY]: refused(inFlight, { error: { code: ACTION_ERROR.CONFLICT } }, 1, NOW),
      }),
    );
    notify();

    // Pending here only because this tab read it, not because this tab asked.
    // Held as its own, the entry would ignore the document that ends it.
    expect(store.getEntry(KEY)?.error?.code).toBe(ACTION_ERROR.CONFLICT);
  });
});

describe('setScope', () => {
  /** A slot holding one refused write, written under the scope given. */
  function seeded(scope: string | null) {
    return fakeStorage(serializeEntries({ [KEY]: failedEntry() }, scope));
  }

  it('reads back an overlay the same User left behind', () => {
    const store = createOptimisticStore({ storage: seeded('user-1'), now: () => NOW });

    // Not read at construction: the page has not said who is here yet.
    expect(store.getEntry(KEY)).toBeNull();

    store.setScope('user-1');

    expect(store.getEntry(KEY)?.error?.code).toBe(ACTION_ERROR.CONFLICT);
  });

  it('drops an overlay somebody else left on this machine, from memory and from the slot', () => {
    const storage = seeded('user-1');
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.setScope('user-2');

    expect(store.getEntry(KEY)).toBeNull();
    // Left in the slot, the next `user-1` page would show a failure the second
    // User could have caused, and the second User's own writes would sit under a
    // document addressed to the first.
    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toBeNull();
  });

  it('writes what follows under the scope it was given', () => {
    const storage = fakeStorage();
    const store = createOptimisticStore({ storage, now: () => NOW });

    store.setScope('user-1');

    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });

    expect(storage.getItem(OPTIMISTIC_STORAGE_KEY)).toContain('"scope":"user-1"');
  });

  it('changes nothing when the scope it is given is the one it already has', () => {
    const store = createOptimisticStore({ storage: fakeStorage(), now: () => NOW });
    const call = store.begin(KEY, {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'A' },
    });

    store.settleFailure(KEY, call, { error: { code: ACTION_ERROR.CONFLICT } });
    store.setScope(null);

    expect(store.getEntry(KEY)?.error?.code).toBe(ACTION_ERROR.CONFLICT);
  });
});
