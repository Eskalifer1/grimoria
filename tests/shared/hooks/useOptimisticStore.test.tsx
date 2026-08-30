import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_STORAGE_KEY, PENDING_ACTION } from '@/constants/optimistic';
import { OptimisticScope } from '@/shared/components/OptimisticScope';
import { useOptimisticEntry } from '@/shared/hooks/useOptimisticEntry';
import { OptimisticStoreContext } from '@/shared/hooks/useOptimisticStore';
import { serializeEntries } from '@/shared/lib/optimistic/persistence';
import {
  createOptimisticStore,
  type OptimisticStorage,
  type OptimisticStore,
  optimisticStore,
} from '@/shared/lib/optimistic/store';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

const KEY = 'note:1';
const NOW = 1_700_000_000_000;

function fakeStorage(seed: string | null = null): OptimisticStorage {
  let value = seed;

  return {
    getItem: (key) => (key === OPTIMISTIC_STORAGE_KEY ? value : null),
    setItem: (key, next) => {
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

/** A slot holding one refused write, written under the scope given. */
function seeded(scope: string | null): OptimisticStorage {
  const settled = settleFailureEntry(
    beginEntry(null, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } }, 1, NOW),
    { error: { code: ACTION_ERROR.CONFLICT } },
    1,
    NOW,
  );

  if (settled === null) {
    throw new Error('the failure left nothing behind');
  }

  return fakeStorage(serializeEntries({ [KEY]: settled }, scope));
}

/** Records what it read on every render, so a test can assert on the first one. */
function Probe({ seen }: { seen: string[] }) {
  const entry = useOptimisticEntry(KEY);
  const title = typeof entry?.patch.title === 'string' ? entry.patch.title : 'none';

  seen.push(title);

  return <p>{`title:${title}`}</p>;
}

function renderUnder(store: OptimisticStore, scope?: string) {
  const seen: string[] = [];

  render(
    <OptimisticStoreContext.Provider value={store}>
      {scope === undefined ? null : <OptimisticScope scope={scope} />}
      <Probe seen={seen} />
    </OptimisticStoreContext.Provider>,
  );

  return seen;
}

beforeEach(() => {
  optimisticStore.clearAll();
});

describe('the store a tree reads', () => {
  it('is the one the context carries, not the app singleton', () => {
    const store = createOptimisticStore({ storage: null, now: () => NOW });

    renderUnder(store);

    act(() => {
      store.begin(KEY, { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' } });
    });

    expect(screen.getByText('title:Typed')).toBeInTheDocument();
    // The point of the context: a test renders against a store of its own rather
    // than against global state every other case has to remember to wipe.
    expect(optimisticStore.getEntry(KEY)).toBeNull();
  });

  it('is the app singleton when nothing provides one', () => {
    const seen: string[] = [];

    render(<Probe seen={seen} />);

    act(() => {
      optimisticStore.begin(KEY, {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Typed' },
      });
    });

    expect(screen.getByText('title:Typed')).toBeInTheDocument();
  });
});

describe('OptimisticScope', () => {
  it('has the overlay on screen from the first render, not one frame later', () => {
    const store = createOptimisticStore({ storage: seeded('user-1'), now: () => NOW });

    // An effect would run after the surface below had already rendered, and that
    // first frame is the one this exists to get right.
    expect(renderUnder(store, 'user-1')[0]).toBe('Typed');
  });

  it('renders nothing of an overlay somebody else left on this machine', () => {
    const store = createOptimisticStore({ storage: seeded('user-1'), now: () => NOW });

    expect(renderUnder(store, 'user-2')).toEqual(['none']);
  });
});
