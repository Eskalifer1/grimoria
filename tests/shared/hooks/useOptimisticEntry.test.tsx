import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PENDING_ACTION } from '@/constants/optimistic';
import { useOptimisticEntry } from '@/shared/hooks/useOptimisticEntry';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';

const NOTE_ID = '44444444-4444-4444-8444-444444444444';

function Probe({ id }: { id: string }) {
  const entry = useOptimisticEntry(noteKey(id));

  return <p>{`title:${String(entry?.patch.title ?? 'none')}`}</p>;
}

function beginWrite(title: string) {
  act(() => {
    optimisticStore.begin(noteKey(NOTE_ID), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title },
    });
  });
}

beforeEach(() => {
  optimisticStore.clearAll();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useOptimisticEntry', () => {
  it('answers nothing while the key has no entry', () => {
    render(<Probe id={NOTE_ID} />);

    expect(screen.getByText('title:none')).toBeInTheDocument();
  });

  it('re-renders when the key it watches changes', () => {
    render(<Probe id={NOTE_ID} />);

    beginWrite('Typed');

    expect(screen.getByText('title:Typed')).toBeInTheDocument();
  });

  it('ignores a write to another key', () => {
    render(<Probe id={NOTE_ID} />);

    act(() => {
      optimisticStore.begin(noteKey('other'), {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Elsewhere' },
      });
    });

    expect(screen.getByText('title:none')).toBeInTheDocument();
  });

  it('unsubscribes on unmount, and a later write neither warns nor throws', () => {
    const released = vi.fn();
    const subscribe = optimisticStore.subscribe.bind(optimisticStore);

    vi.spyOn(optimisticStore, 'subscribe').mockImplementation((listener) => {
      const off = subscribe(listener);

      return () => {
        released();
        off();
      };
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<Probe id={NOTE_ID} />);

    view.unmount();
    beginWrite('After');

    expect(released).toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
