import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import { type OptimisticFailureMode, useOptimisticValue } from '@/shared/hooks/useOptimisticValue';
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

interface ProbeProps {
  note: MockNote;
  drafts?: readonly string[];
  onFailure?: OptimisticFailureMode;
}

function Probe({ note, drafts, onFailure }: ProbeProps) {
  const options = drafts ?? ['Renamed'];
  const title = useOptimisticValue({
    descriptor: updateNoteOptimistic,
    input: { id: note.id },
    field: 'title',
    onFailure,
    value: note.title,
    version: note.updatedAt,
  });

  return (
    <div>
      <p>{`title:${title.value}`}</p>
      <p>{`pending:${String(title.isPending)}`}</p>
      <p>{`code:${title.error?.code ?? 'none'}`}</p>
      {options.map((draft) => (
        <button key={draft} type="button" onClick={() => void title.run(draft)}>
          {`save:${draft}`}
        </button>
      ))}
      <button type="button" onClick={title.dismiss}>
        dismiss
      </button>
    </div>
  );
}

function save(draft = 'Renamed') {
  fireEvent.click(screen.getByRole('button', { name: `save:${draft}` }));
}

function controls(overrides: Partial<typeof DEFAULT_MOCK_CONTROLS> = {}) {
  return { ...DEFAULT_MOCK_CONTROLS, latencyMs: 0, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readMockControls).mockResolvedValue(controls());
  seedMockDatabase();
  optimisticStore.clearAll();
});

describe('useOptimisticValue', () => {
  it('renders the server value while the store knows nothing', () => {
    render(<Probe note={seedNote(0)} />);

    expect(screen.getByText(`title:${seedNote(0).title}`)).toBeInTheDocument();
    expect(screen.getByText('pending:false')).toBeInTheDocument();
  });

  it('renders what was typed before the server has answered', () => {
    render(<Probe note={seedNote(0)} />);

    save();

    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
    expect(screen.getByText('pending:true')).toBeInTheDocument();
  });

  it('keeps the value and drops the flight state once the answer lands', async () => {
    render(<Probe note={seedNote(0)} />);

    save();

    expect(await screen.findByText('pending:false')).toBeInTheDocument();
    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
  });

  it('leaves what was typed on screen when the write fails, with the reason', async () => {
    vi.mocked(readMockControls).mockResolvedValue(
      controls({ alwaysFailure: ACTION_ERROR.CONFLICT }),
    );

    render(<Probe note={seedNote(0)} />);

    save();

    expect(await screen.findByText(`code:${ACTION_ERROR.CONFLICT}`)).toBeInTheDocument();
    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
  });

  it.each(Object.values(ACTION_ERROR))('passes the %s code through unchanged', async (code) => {
    vi.mocked(readMockControls).mockResolvedValue(controls({ alwaysFailure: code }));

    render(<Probe note={seedNote(0)} />);

    save();

    expect(await screen.findByText(`code:${code}`)).toBeInTheDocument();
  });

  it('throws the attempt away on dismiss, back to the server value', async () => {
    vi.mocked(readMockControls).mockResolvedValue(
      controls({ alwaysFailure: ACTION_ERROR.UNEXPECTED }),
    );

    render(<Probe note={seedNote(0)} />);

    save();
    expect(await screen.findByText(`code:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));

    expect(screen.getByText(`title:${seedNote(0).title}`)).toBeInTheDocument();
    expect(screen.getByText('code:none')).toBeInTheDocument();
  });

  it('shows the second write when the first one answers last', async () => {
    // The mock's own one-shot latency, so the ordering rule is proved through a
    // real round trip rather than through the store alone.
    vi.mocked(readMockControls)
      .mockResolvedValueOnce(controls({ nextLatencyMs: 80 }))
      .mockResolvedValue(controls());

    render(<Probe note={seedNote(0)} drafts={['First', 'Second']} />);

    save('First');
    save('Second');

    expect(await screen.findByText('pending:false')).toBeInTheDocument();
    expect(screen.getByText('title:Second')).toBeInTheDocument();

    // Long enough for the first answer to arrive behind the second and be thrown away.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(screen.getByText('title:Second')).toBeInTheDocument();
  });

  it('survives a remount, because the store holds the value and not the component', async () => {
    const view = render(<Probe note={seedNote(0)} />);

    save();
    expect(await screen.findByText('pending:false')).toBeInTheDocument();

    view.unmount();
    render(<Probe note={seedNote(0)} />);

    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
  });

  it('lets the overlay die once the server render catches up', async () => {
    const note = seedNote(0);
    const view = render(<Probe note={note} />);

    save();
    expect(await screen.findByText('pending:false')).toBeInTheDocument();

    const settled = optimisticStore.getEntry(noteKey(note.id));

    view.rerender(
      <Probe note={{ ...note, title: 'Renamed', updatedAt: settled?.sourceVersion ?? '' }} />,
    );

    expect(optimisticStore.getEntry(noteKey(note.id))).toBeNull();
    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
  });

  it('keeps the overlay when the render is older than the write', async () => {
    const note = seedNote(0);
    const view = render(<Probe note={note} />);

    save();
    expect(await screen.findByText('pending:false')).toBeInTheDocument();

    view.rerender(<Probe note={{ ...note, title: 'Stale', updatedAt: note.updatedAt }} />);

    expect(screen.getByText('title:Renamed')).toBeInTheDocument();
  });
});

describe('what a refusal leaves behind', () => {
  it('hands the field back to the server and says why, under `rollback`', async () => {
    const note = seedNote(0);

    vi.mocked(readMockControls).mockResolvedValue(
      controls({ alwaysFailure: ACTION_ERROR.FORBIDDEN }),
    );

    render(<Probe note={note} onFailure="rollback" />);
    save();

    expect(await screen.findByText(`code:${ACTION_ERROR.FORBIDDEN}`)).toBeInTheDocument();
    // A control with no half-state has nowhere to hold a value the server
    // refused, so the message would otherwise explain a state nobody can see.
    expect(screen.getByText(`title:${note.title}`)).toBeInTheDocument();
  });

  it('records nothing at all under `silent`, and leaves the key as it found it', async () => {
    const note = seedNote(0);

    vi.mocked(readMockControls).mockResolvedValue(
      controls({ alwaysFailure: ACTION_ERROR.FORBIDDEN }),
    );

    render(<Probe note={note} onFailure="silent" />);
    save();

    expect(await screen.findByText('pending:false')).toBeInTheDocument();
    expect(screen.getByText(`title:${note.title}`)).toBeInTheDocument();
    expect(screen.getByText('code:none')).toBeInTheDocument();
    // The reason belongs to the record, not to the one control that wrote it:
    // kept here, every other surface on this key would read it and say so.
    expect(optimisticStore.getEntry(noteKey(note.id))).toBeNull();
  });
});

describe('what a dismissal reaches', () => {
  it('leaves the rest of the record alone when the reason names this field', async () => {
    const note = seedNote(0);

    optimisticStore.begin(noteKey(note.id), {
      action: PENDING_ACTION.UPDATE,
      optimisticData: { done: true },
    });

    // An empty title, so the schema refuses it and names the field it refused.
    render(<Probe note={note} drafts={['']} />);
    fireEvent.click(screen.getByRole('button', { name: 'save:' }));

    await screen.findByText(`code:${ACTION_ERROR.INVALID_INPUT}`);
    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));

    // A key is one record. Dismissing it whole throws away every other field's
    // unsaved value along with the message the User asked to be rid of.
    expect(optimisticStore.getEntry(noteKey(note.id))?.patch).toEqual({ done: true });
  });
});
