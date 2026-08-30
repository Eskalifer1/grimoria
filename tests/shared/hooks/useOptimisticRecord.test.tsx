import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import { useOptimisticRecord } from '@/shared/hooks/useOptimisticRecord';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { DEFAULT_MOCK_CONTROLS } from '../../fixtures/notes/mockControls';
import { readMockControls } from '../../fixtures/notes/mockControlsStore';
import { type MockNote, seedMockDatabase } from '../../fixtures/notes/mockDatabase';
import { seedNote } from '../../fixtures/notes/seed';
import { updateNoteOptimistic } from '../../fixtures/notes/updateNote/optimistic';

vi.mock('../../fixtures/notes/mockControlsStore', () => ({
  readMockControls: vi.fn(),
  writeMockControls: vi.fn(),
}));

function Probe({ note }: { note: MockNote }) {
  const record = useOptimisticRecord({
    descriptor: updateNoteOptimistic,
    input: { id: note.id },
    values: { title: note.title, body: note.body, done: note.done },
    version: note.updatedAt,
  });

  return (
    <div>
      <p>{`title:${record.values.title}`}</p>
      <p>{`body:${record.values.body}`}</p>
      <p>{`pending-title:${record.pendingFields.title ?? 'none'}`}</p>
      <p>{`pending-body:${record.pendingFields.body ?? 'none'}`}</p>
      <p>{`code:${record.error?.code ?? 'none'}`}</p>
      <p>{`title-code:${record.fieldErrors.title?.code ?? 'none'}`}</p>
      <button type="button" onClick={() => void record.run({ title: 'Renamed' })}>
        save-title
      </button>
      <button type="button" onClick={() => void record.run({ title: '' })}>
        save-empty-title
      </button>
      <button type="button" onClick={() => record.dismiss('title')}>
        dismiss-title
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

describe('useOptimisticRecord', () => {
  it('renders the server values while the store knows nothing', () => {
    const note = seedNote(0);

    render(<Probe note={note} />);

    expect(screen.getByText(`title:${note.title}`)).toBeInTheDocument();
    expect(screen.getByText(`body:${note.body}`)).toBeInTheDocument();
  });

  it('reports flight per field — one saving while the others are idle', () => {
    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save-title' }));

    expect(screen.getByText(`pending-title:${PENDING_ACTION.UPDATE}`)).toBeInTheDocument();
    expect(screen.getByText('pending-body:none')).toBeInTheDocument();
    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
    expect(screen.getByText(`body:${seedNote(0).body}`)).toBeInTheDocument();
  });

  it('files a rejected field beside that field, and at the record too', async () => {
    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save-empty-title' }));

    expect(await screen.findByText(`title-code:${ACTION_ERROR.INVALID_INPUT}`)).toBeInTheDocument();
    expect(screen.getByText(`code:${ACTION_ERROR.INVALID_INPUT}`)).toBeInTheDocument();
    expect(screen.getByText('pending-title:none')).toBeInTheDocument();
  });

  it('clears a field failure from the record as well as from the field', async () => {
    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save-empty-title' }));
    expect(await screen.findByText(`title-code:${ACTION_ERROR.INVALID_INPUT}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dismiss-title' }));

    // The same failure is filed under the field and on the record. Leaving the
    // record's copy makes the dismiss button clear nothing the User can see.
    expect(screen.getByText('title-code:none')).toBeInTheDocument();
    expect(screen.getByText('code:none')).toBeInTheDocument();
  });

  it('writes the server answer over every field it names', async () => {
    render(<Probe note={seedNote(0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'save-title' }));

    expect(await screen.findByText('pending-title:none')).toBeInTheDocument();
    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
    expect(screen.getByText(`body:${seedNote(0).body}`)).toBeInTheDocument();
  });
});
