import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PENDING_ACTION } from '@/constants/optimistic';
import { useOptimisticRead } from '@/shared/hooks/useOptimisticRead';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';

const NOTE_ID = '44444444-4444-4444-8444-444444444444';
const OLD = '2026-08-25T10:00:00.000Z';
const NEW = '2026-08-25T10:05:00.000Z';

function Probe({ value, version }: { value: string; version: string }) {
  const title = useOptimisticRead({ key: noteKey(NOTE_ID), field: 'title', value, version });

  return (
    <div>
      <p>{`title:${title.value}`}</p>
      <p>{`pending:${title.pendingAction ?? 'none'}`}</p>
    </div>
  );
}

function beginWrite(title: string) {
  let call = 0;

  act(() => {
    call = optimisticStore.begin(noteKey(NOTE_ID), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title },
      sourceVersion: OLD,
    });
  });

  return call;
}

beforeEach(() => {
  optimisticStore.clearAll();
});

describe('useOptimisticRead', () => {
  it('renders the server value while the store knows nothing', () => {
    render(<Probe value="Server" version={OLD} />);

    expect(screen.getByText('title:Server')).toBeInTheDocument();
  });

  it('renders the store value the moment a write begins elsewhere', () => {
    render(<Probe value="Server" version={OLD} />);

    beginWrite('Typed');

    expect(screen.getByText('title:Typed')).toBeInTheDocument();
    expect(screen.getByText('pending:update')).toBeInTheDocument();
  });

  it('lets the overlay go once the server render has caught up', () => {
    const call = beginWrite('Typed');
    act(() => {
      optimisticStore.settleSuccess(noteKey(NOTE_ID), call, { serverVersion: NEW });
    });

    const { rerender } = render(<Probe value="Server" version={OLD} />);
    expect(screen.getByText('title:Typed')).toBeInTheDocument();

    rerender(<Probe value="Typed" version={NEW} />);
    expect(screen.getByText('title:Typed')).toBeInTheDocument();
    expect(screen.getByText('pending:none')).toBeInTheDocument();
    expect(optimisticStore.getSnapshot()[noteKey(NOTE_ID)]).toBeUndefined();
  });
});
