import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import { ROUTES } from '@/constants/routes';
import { useBrickRoad } from '@/shared/hooks/useBrickRoad';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { DEFAULT_MOCK_CONTROLS } from '../../fixtures/notes/mockControls';
import { readMockControls } from '../../fixtures/notes/mockControlsStore';
import { type MockNote, seedMockDatabase } from '../../fixtures/notes/mockDatabase';
import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';
import { seedNote } from '../../fixtures/notes/seed';
import { updateNoteOptimistic } from '../../fixtures/notes/updateNote/optimistic';

vi.mock('../../fixtures/notes/mockControlsStore', () => ({
  readMockControls: vi.fn(),
  writeMockControls: vi.fn(),
}));

function Probe({ note }: { note: MockNote }) {
  const title = useOptimisticValue({
    descriptor: updateNoteOptimistic,
    input: { id: note.id },
    field: 'title',
    value: note.title,
    version: note.updatedAt,
  });
  const road = useBrickRoad([{ key: noteKey(note.id), href: ROUTES.PROFILE }]);

  return (
    <div>
      <p>
        {road === null ? 'road:clear' : `road:${road.status}:${road.reason}:${road.targetHref}`}
      </p>
      <button type="button" onClick={() => void title.run('Renamed')}>
        save
      </button>
      <button type="button" onClick={title.dismiss}>
        dismiss
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readMockControls).mockResolvedValue({ ...DEFAULT_MOCK_CONTROLS, latencyMs: 0 });
  seedMockDatabase();
  optimisticStore.clearAll();
});

describe('useBrickRoad', () => {
  it('answers nothing while nothing is wrong', () => {
    render(<Probe note={seedNote(0)} />);

    expect(screen.getByText('road:clear')).toBeInTheDocument();
  });

  it('stays quiet while a write is merely in flight', () => {
    vi.mocked(readMockControls).mockResolvedValue({ ...DEFAULT_MOCK_CONTROLS, latencyMs: 50 });

    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(screen.getByText('road:clear')).toBeInTheDocument();
  });

  it('carries the reason and a route the User can follow to it', async () => {
    vi.mocked(readMockControls).mockResolvedValue({
      ...DEFAULT_MOCK_CONTROLS,
      latencyMs: 0,
      alwaysFailure: ACTION_ERROR.CONFLICT,
    });

    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(
      await screen.findByText(
        `road:${ACTION_STATUS.FAILURE}:${ACTION_ERROR.CONFLICT}:${ROUTES.PROFILE}`,
      ),
    ).toBeInTheDocument();
  });

  it('goes quiet again once the attempt is dismissed', async () => {
    vi.mocked(readMockControls).mockResolvedValue({
      ...DEFAULT_MOCK_CONTROLS,
      latencyMs: 0,
      alwaysFailure: ACTION_ERROR.UNEXPECTED,
    });

    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(
      await screen.findByText(new RegExp(`^road:.*${ACTION_ERROR.UNEXPECTED}`)),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));

    expect(screen.getByText('road:clear')).toBeInTheDocument();
  });

  it('watches every key it is given, not only the first', () => {
    const first = seedNote(0);
    const second = seedNote(1);

    function TwoProbe() {
      const road = useBrickRoad([
        { key: noteKey(first.id), href: ROUTES.HOME },
        { key: noteKey(second.id), href: ROUTES.PROFILE },
      ]);

      return <p>{road === null ? 'road:clear' : `road:${road.targetHref}`}</p>;
    }

    render(<TwoProbe />);

    expect(screen.getByText('road:clear')).toBeInTheDocument();

    act(() => {
      const key = noteKey(second.id);
      const call = optimisticStore.begin(key, { action: PENDING_ACTION.UPDATE });

      optimisticStore.settleFailure(key, call, { error: { code: ACTION_ERROR.NOT_FOUND } });
    });

    expect(screen.getByText(`road:${ROUTES.PROFILE}`)).toBeInTheDocument();
  });
});
