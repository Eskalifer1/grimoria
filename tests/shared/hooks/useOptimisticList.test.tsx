import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import { useOptimisticList } from '@/shared/hooks/useOptimisticList';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { createNoteOptimistic } from '../../fixtures/notes/createNote/optimistic';
import { deleteNoteOptimistic } from '../../fixtures/notes/deleteNote/optimistic';
import { DEFAULT_MOCK_CONTROLS } from '../../fixtures/notes/mockControls';
import { readMockControls } from '../../fixtures/notes/mockControlsStore';
import { getMockNotes, type MockNote, seedMockDatabase } from '../../fixtures/notes/mockDatabase';
import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';
import { seedNote } from '../../fixtures/notes/seed';

vi.mock('../../fixtures/notes/mockControlsStore', () => ({
  readMockControls: vi.fn(),
  writeMockControls: vi.fn(),
}));

const NEW_ID = '55555555-5555-4555-8555-555555555555';

interface ProbeProps {
  notes: readonly MockNote[];
  draftTitle?: string;
}

function Probe({ notes, draftTitle }: ProbeProps) {
  const title = draftTitle ?? 'Fresh';
  const list = useOptimisticList({
    items: notes,
    add: createNoteOptimistic,
    remove: deleteNoteOptimistic,
    identify: (note: MockNote) => ({ id: note.id }),
    draft: (input) => ({
      id: input.id,
      title: input.title,
      body: '',
      done: false,
      updatedAt: '',
    }),
    version: (note: MockNote) => note.updatedAt,
  });

  return (
    <div>
      <p>{`count:${list.items.length}`}</p>
      <ol>
        {list.items.map((row) => (
          <li key={row.key}>
            <span>{`row:${row.item.title}:${row.pendingAction ?? 'none'}:${row.error?.code ?? 'none'}`}</span>
            <button type="button" onClick={() => void list.remove(row.item)}>
              {`remove:${row.item.title}`}
            </button>
            <button type="button" onClick={() => list.dismiss(row.item)}>
              {`dismiss:${row.item.title}`}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => void list.add({ id: NEW_ID, title })}>
        add
      </button>
    </div>
  );
}

function everyNote(): MockNote[] {
  return [...getMockNotes().values()];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readMockControls).mockResolvedValue({ ...DEFAULT_MOCK_CONTROLS, latencyMs: 0 });
  seedMockDatabase();
  optimisticStore.clearAll();
});

describe('an optimistic insert', () => {
  it('puts the row on screen with the id the client minted, before the server answers', () => {
    render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText(`row:Fresh:${PENDING_ACTION.ADD}:none`)).toBeInTheDocument();
    expect(screen.getByText(`count:${everyNote().length + 1}`)).toBeInTheDocument();
  });

  it('keeps the row in place when the answer lands, rather than replacing it', async () => {
    const view = render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText('row:Fresh:none:none')).toBeInTheDocument();

    view.rerender(<Probe notes={everyNote()} />);

    expect(screen.getAllByText(/^row:Fresh/)).toHaveLength(1);
    expect(screen.getByText(`count:${everyNote().length}`)).toBeInTheDocument();
  });

  it('leaves a failed insert on screen and marked', async () => {
    render(<Probe notes={everyNote()} draftTitle="fail" />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(`row:fail:none:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();
  });

  it('rebuilds the failed row from the store, so a reload keeps what was typed', async () => {
    const first = render(<Probe notes={everyNote()} draftTitle="fail" />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(await screen.findByText(`row:fail:none:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();

    // A reload keeps only what reached the store; React state does not survive it.
    first.unmount();
    render(<Probe notes={everyNote()} draftTitle="fail" />);

    expect(await screen.findByText(`row:fail:none:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();
  });

  it('retires the overlay once the server list carries the row', async () => {
    const view = render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(await screen.findByText('row:Fresh:none:none')).toBeInTheDocument();

    view.rerender(<Probe notes={everyNote()} />);

    // Left behind, the whole row would sit in `localStorage` for the entry's life.
    await waitFor(() => expect(optimisticStore.getEntry(noteKey(NEW_ID))).toBeNull());
  });

  it('takes the failed row away when the attempt is dismissed', async () => {
    render(<Probe notes={everyNote()} draftTitle="fail" />);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(await screen.findByText(`row:fail:none:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dismiss:fail' }));

    expect(screen.queryByText(/^row:fail/)).not.toBeInTheDocument();
  });
});

describe('an optimistic removal', () => {
  it('keeps the row in its position while the delete is in flight', () => {
    const target = seedNote(0);

    render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: `remove:${target.title}` }));

    expect(
      screen.getByText(`row:${target.title}:${PENDING_ACTION.DELETE}:none`),
    ).toBeInTheDocument();
  });

  it('drops the row once the server confirms it', async () => {
    const target = seedNote(0);

    render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: `remove:${target.title}` }));

    expect(await screen.findByText(`count:${everyNote().length}`)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`^row:${target.title}`))).not.toBeInTheDocument();
  });

  it('leaves the row present and marked when the delete fails', async () => {
    const target = seedNote(0);

    vi.mocked(readMockControls).mockResolvedValue({
      ...DEFAULT_MOCK_CONTROLS,
      latencyMs: 0,
      alwaysFailure: ACTION_ERROR.NOT_FOUND,
    });

    render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: `remove:${target.title}` }));

    expect(
      await screen.findByText(`row:${target.title}:none:${ACTION_ERROR.NOT_FOUND}`),
    ).toBeInTheDocument();
  });

  it('shows the row again when a later read carries it, rather than hiding it for good', async () => {
    const target = seedNote(0);
    const { rerender } = render(<Probe notes={everyNote()} />);

    fireEvent.click(screen.getByRole('button', { name: `remove:${target.title}` }));
    await screen.findByText(`count:${everyNote().length}`);

    // The read that proves the removal, and then the row back under the same id
    // — a re-seed, a restore, an undo. Held past the first of those, the key
    // hides every row that arrives under it afterwards, and only a reload helps.
    rerender(<Probe notes={everyNote()} />);
    seedMockDatabase();
    rerender(<Probe notes={everyNote()} />);

    expect(await screen.findByText(new RegExp(`^row:${target.title}`))).toBeInTheDocument();
  });
});

describe('the merge with the server list', () => {
  it('draws no row for a patch that is not a whole row', async () => {
    const target = seedNote(0);

    // A field write on a row the server has since stopped sending — another tab
    // deleted it, or the list was re-read. The patch is changed fields only, so
    // it has no id: rendered as a row it is addressed as `note:undefined`, which
    // every such patch shares and nothing on screen can reach.
    optimisticStore.begin(noteKey(target.id), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Edited' },
    });

    render(<Probe notes={everyNote().filter((note) => note.id !== target.id)} />);

    expect(await screen.findByText(`count:${everyNote().length - 1}`)).toBeInTheDocument();
    expect(screen.queryByText('row:Edited:update:none')).not.toBeInTheDocument();
  });

  it('overlays a write opened on another screen onto the row it belongs to', () => {
    const target = seedNote(0);

    optimisticStore.begin(noteKey(target.id), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { title: 'Elsewhere' },
    });

    render(<Probe notes={everyNote()} />);

    expect(screen.getByText(`row:Elsewhere:${PENDING_ACTION.UPDATE}:none`)).toBeInTheDocument();
  });

  it('renders the server list untouched while nothing is in flight', () => {
    render(<Probe notes={everyNote()} />);

    expect(screen.getByText(`count:${everyNote().length}`)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(everyNote().length);
  });
});
