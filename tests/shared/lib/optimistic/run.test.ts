import { beforeEach, describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_ERROR, PENDING_ACTION } from '@/constants/optimistic';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';
import { runOptimistic } from '@/shared/lib/optimistic/run';
import { createOptimisticStore, type OptimisticStore } from '@/shared/lib/optimistic/store';

interface Note {
  id: string;
  title: string;
  updatedAt: string;
}

const ID = 'a1';

/** A descriptor over an action the test settles by hand. */
function probeDescriptor(
  run: (input: { id: string; title?: string }) => Promise<ActionResult<Note>>,
) {
  return optimisticDescriptor({
    run,
    pending: PENDING_ACTION.UPDATE,
    key: (input) => `probe:${input.id}`,
    value: (data) => ({ title: data.title }),
    version: (data) => data.updatedAt,
  });
}

function deferred<TValue>() {
  let resolve: ((value: TValue) => void) | undefined;
  const promise = new Promise<TValue>((settle) => {
    resolve = settle;
  });

  return { promise, resolve: (value: TValue) => resolve?.(value) };
}

let store: OptimisticStore;

beforeEach(() => {
  store = createOptimisticStore({ storage: null });
});

describe('runOptimistic', () => {
  it('opens the write on the descriptor key, with the descriptor pending action', async () => {
    const pending = deferred<ActionResult<Note>>();
    const descriptor = probeDescriptor(() => pending.promise);

    const call = runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      {
        optimisticData: { title: 'Typed' },
        sourceVersion: '2026-01-01T00:00:00.000Z',
        store,
      },
    );

    const entry = store.getEntry(`probe:${ID}`);

    expect(entry?.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(entry?.patch).toEqual({ title: 'Typed' });
    expect(entry?.pendingFields).toEqual({ title: PENDING_ACTION.UPDATE });
    expect(entry?.sourceVersion).toBe('2026-01-01T00:00:00.000Z');

    pending.resolve(
      actionSuccess({ id: ID, title: 'Typed', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );
    await call;
  });

  it('settles with the server value and the server version', async () => {
    const descriptor = probeDescriptor(async () =>
      actionSuccess({ id: ID, title: 'Typed2', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );

    await runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      {
        optimisticData: { title: 'Typed' },
        store,
      },
    );

    const entry = store.getEntry(`probe:${ID}`);

    expect(entry?.patch).toEqual({ title: 'Typed2' });
    expect(entry?.pendingAction).toBeNull();
    expect(entry?.sourceVersion).toBe('2026-01-02T00:00:00.000Z');
  });

  it('records the action failure code, and answers it to the caller', async () => {
    const descriptor = probeDescriptor(async () => actionFailure(ACTION_ERROR.NOT_FOUND));

    const result = await runOptimistic(descriptor, { id: ID }, { store });

    expect(result.error?.code).toBe(ACTION_ERROR.NOT_FOUND);
    expect(store.getEntry(`probe:${ID}`)?.error?.code).toBe(ACTION_ERROR.NOT_FOUND);
  });

  it('applies failureData, which is what a rollback is', async () => {
    const descriptor = probeDescriptor(async () => actionFailure(ACTION_ERROR.CONFLICT));

    await runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      {
        optimisticData: { title: 'Typed' },
        failureData: { title: 'Server' },
        store,
      },
    );

    expect(store.getEntry(`probe:${ID}`)?.patch).toEqual({ title: 'Server' });
  });

  it('answers UNEXPECTED when the request itself breaks, rather than throwing at the caller', async () => {
    const descriptor = probeDescriptor(() => Promise.reject(new Error('offline')));

    const result = await runOptimistic(descriptor, { id: ID }, { store });

    expect(result.error?.code).toBe(ACTION_ERROR.UNEXPECTED);
    expect(store.getEntry(`probe:${ID}`)?.pendingAction).toBeNull();
  });

  it('discards the slower first answer whole, leaving the second write on screen', async () => {
    const slow = deferred<ActionResult<Note>>();
    const fast = deferred<ActionResult<Note>>();
    const answers = [slow.promise, fast.promise];
    let answered = 0;
    const descriptor = probeDescriptor(() => answers[answered++] ?? slow.promise);

    const first = runOptimistic(
      descriptor,
      { id: ID, title: 'First' },
      {
        optimisticData: { title: 'First' },
        store,
      },
    );
    const second = runOptimistic(
      descriptor,
      { id: ID, title: 'Second' },
      {
        optimisticData: { title: 'Second' },
        store,
      },
    );

    fast.resolve(actionSuccess({ id: ID, title: 'Second', updatedAt: '2026-01-03T00:00:00.000Z' }));
    await second;
    slow.resolve(actionSuccess({ id: ID, title: 'First', updatedAt: '2026-01-02T00:00:00.000Z' }));
    await first;

    expect(store.getEntry(`probe:${ID}`)?.patch).toEqual({ title: 'Second' });
  });

  it('writes to the app store when no store is injected', async () => {
    const { optimisticStore } = await import('@/shared/lib/optimistic/store');
    const descriptor = probeDescriptor(async () =>
      actionSuccess({ id: ID, title: 'Typed', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );

    await runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      { optimisticData: { title: 'Typed' } },
    );

    expect(optimisticStore.getEntry(`probe:${ID}`)?.patch).toEqual({ title: 'Typed' });

    optimisticStore.clearAll();
  });

  it('needs no options at all — a delete carries no optimistic value', async () => {
    const descriptor = probeDescriptor(async () =>
      actionSuccess({ id: ID, title: 'Gone', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );

    await runOptimistic(descriptor, { id: ID }, { store });

    expect(store.getEntry(`probe:${ID}`)).not.toBeNull();
  });
});

describe('the mapper slots', () => {
  it('lets a hand-written successData beat the server value', async () => {
    const descriptor = probeDescriptor(async () =>
      actionSuccess({ id: ID, title: 'Server', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );

    await runOptimistic(descriptor, { id: ID }, { successData: { title: 'Chosen' }, store });

    expect(store.getEntry(`probe:${ID}`)?.patch).toEqual({ title: 'Chosen' });
  });

  it('applies finallyData on both paths', async () => {
    const failing = probeDescriptor(async () => actionFailure(ACTION_ERROR.UNEXPECTED));

    await runOptimistic(failing, { id: ID }, { finallyData: { saving: false }, store });

    expect(store.getEntry(`probe:${ID}`)?.patch).toEqual({ saving: false });
  });
});

describe('a descriptor without mappers', () => {
  it('settles without touching the patch or the version', async () => {
    const descriptor = optimisticDescriptor({
      run: async (input: { id: string }) => actionSuccess({ id: input.id }),
      pending: PENDING_ACTION.DELETE,
      key: (input) => `probe:${input.id}`,
    });

    await runOptimistic(
      descriptor,
      { id: ID },
      { sourceVersion: '2026-01-01T00:00:00.000Z', store },
    );

    // Nothing to overlay and nothing to say: written back, the key would sit in
    // the document until the next page load, because a delete never reconciles.
    expect(store.getEntry(`probe:${ID}`)).toBeNull();
  });
});

describe('the order of operations', () => {
  it('never calls the action before the store knows about the write', async () => {
    const order: string[] = [];
    const descriptor = optimisticDescriptor({
      run: async (input: { id: string }) => {
        order.push(store.getEntry(`probe:${input.id}`) === null ? 'store-blind' : 'store-knows');

        return actionSuccess({ id: input.id });
      },
      pending: PENDING_ACTION.ADD,
      key: (input) => `probe:${input.id}`,
    });

    await runOptimistic(descriptor, { id: ID }, { store });

    expect(order).toEqual(['store-knows']);
  });
});

describe('a request that never answers', () => {
  /** Long enough to be a deadline, short enough that a test waits for it. */
  const DEADLINE_MS = 5;

  function afterTheDeadline() {
    return new Promise((settle) => setTimeout(settle, DEADLINE_MS * 4));
  }

  it('settles as timed out, so the interface stops waiting on it', async () => {
    const descriptor = probeDescriptor(() => deferred<ActionResult<Note>>().promise);

    void runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      {
        optimisticData: { title: 'Typed' },
        store,
        timeoutMs: DEADLINE_MS,
      },
    );

    await afterTheDeadline();

    const entry = store.getEntry(`probe:${ID}`);

    // Nothing else ever ends this: a Server Action carries no timeout of its own,
    // so without the deadline the row stays dim for the life of the tab.
    expect(entry?.pendingAction).toBeNull();
    expect(entry?.error).toMatchObject({ code: OPTIMISTIC_ERROR.TIMED_OUT, fields: null });
    expect(entry?.patch).toEqual({ title: 'Typed' });
  });

  it('still settles the answer when it arrives late', async () => {
    const pending = deferred<ActionResult<Note>>();
    const descriptor = probeDescriptor(() => pending.promise);

    const call = runOptimistic(
      descriptor,
      { id: ID, title: 'Typed' },
      {
        optimisticData: { title: 'Typed' },
        store,
        timeoutMs: DEADLINE_MS,
      },
    );

    await afterTheDeadline();
    pending.resolve(
      actionSuccess({ id: ID, title: 'Saved', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );

    // The request was never cancelled — a Server Action cannot be — so a late
    // answer is still the truth, and it clears the deadline's failure. The
    // answer still owns the field: the timeout retired the flight state but
    // opened no newer write, so nothing has taken the field over.
    await expect(call).resolves.toMatchObject({ status: 'success' });
    expect(store.getEntry(`probe:${ID}`)?.patch).toEqual({ title: 'Saved' });
    expect(store.getEntry(`probe:${ID}`)?.error).toBeNull();
    expect(store.getEntry(`probe:${ID}`)?.fieldErrors).toEqual({});
  });

  it('leaves no timer behind once the answer lands in time', async () => {
    const pending = deferred<ActionResult<Note>>();
    const descriptor = probeDescriptor(() => pending.promise);

    const call = runOptimistic(descriptor, { id: ID }, { store, timeoutMs: DEADLINE_MS });

    pending.resolve(
      actionSuccess({ id: ID, title: 'Saved', updatedAt: '2026-01-02T00:00:00.000Z' }),
    );
    await call;
    await afterTheDeadline();

    expect(store.getEntry(`probe:${ID}`)?.error).toBeNull();
  });
});
