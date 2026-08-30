import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION } from '@/constants/optimistic';
import { OptimisticField } from '@/shared/components/OptimisticField';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import { DEFAULT_MOCK_CONTROLS } from '../../fixtures/notes/mockControls';
import { readMockControls } from '../../fixtures/notes/mockControlsStore';
import { seedMockDatabase } from '../../fixtures/notes/mockDatabase';
import { noteKey } from '../../fixtures/notes/noteOptimisticKeys';
import { seedNote } from '../../fixtures/notes/seed';
import { updateNoteOptimistic } from '../../fixtures/notes/updateNote/optimistic';
import { expectNothingAnnounced, messages, renderWithProviders } from '../../setup/render';

vi.mock('../../fixtures/notes/mockControlsStore', () => ({
  readMockControls: vi.fn(),
  writeMockControls: vi.fn(),
}));

const errorCopy = messages.actionError;

function renderField(id: string, value: string, version: string) {
  return renderWithProviders(
    <OptimisticField
      descriptor={updateNoteOptimistic}
      field="title"
      input={{ id }}
      value={value}
      version={version}
    />,
  );
}

/** The leaf as a list row mounts it, where the row around it owns the key. */
function renderScopedField(id: string, value: string, version: string) {
  return renderWithProviders(
    <OptimisticField
      descriptor={updateNoteOptimistic}
      errorScope="field"
      field="title"
      input={{ id }}
      value={value}
      version={version}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readMockControls).mockResolvedValue({ ...DEFAULT_MOCK_CONTROLS, latencyMs: 0 });
  seedMockDatabase();
  optimisticStore.clearAll();
});

describe('OptimisticField', () => {
  it('renders the server value while the store knows nothing', () => {
    const note = seedNote(0);

    renderField(note.id, note.title, note.updatedAt);

    expect(screen.getByText(note.title)).toBeInTheDocument();
    expectNothingAnnounced();
  });

  it('renders the patch the store holds over the server value', async () => {
    const note = seedNote(0);

    renderField(note.id, note.title, note.updatedAt);
    act(() => {
      optimisticStore.begin(noteKey(note.id), {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Renamed' },
        fields: ['title'],
      });
    });

    expect(await screen.findByText('Renamed')).toBeInTheDocument();
    expect(screen.queryByText(note.title)).not.toBeInTheDocument();
  });

  it('renders the failure under the value and keeps the value on screen', async () => {
    const note = seedNote(0);
    const key = noteKey(note.id);

    renderField(note.id, note.title, note.updatedAt);
    act(() => {
      const call = optimisticStore.begin(key, {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Renamed' },
        fields: ['title'],
      });

      optimisticStore.settleFailure(key, call, { error: { code: ACTION_ERROR.UNEXPECTED } });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(errorCopy.unexpected);
    expect(screen.getByText('Renamed')).toBeInTheDocument();
  });

  it('throws the failed attempt away when the User dismisses it', async () => {
    const note = seedNote(0);
    const key = noteKey(note.id);

    renderField(note.id, note.title, note.updatedAt);
    act(() => {
      const call = optimisticStore.begin(key, {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Renamed' },
        fields: ['title'],
      });

      optimisticStore.settleFailure(key, call, { error: { code: ACTION_ERROR.UNEXPECTED } });
    });

    (await screen.findByRole('button')).click();

    await waitFor(() => expectNothingAnnounced());
    expect(screen.getByText(note.title)).toBeInTheDocument();
  });

  it('renders an empty server value without collapsing', () => {
    const note = seedNote(0);

    const { container } = renderField(note.id, '', note.updatedAt);

    expect(container.firstElementChild).not.toBeNull();
  });

  it('never disables anything, however long the write runs', async () => {
    const note = seedNote(0);

    const { container } = renderField(note.id, note.title, note.updatedAt);

    act(() => {
      optimisticStore.begin(noteKey(note.id), {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Renamed' },
        fields: ['title'],
      });
    });
    await screen.findByText('Renamed');

    expect(container.querySelector('[disabled]')).toBeNull();
    expect(container.querySelector('[aria-disabled]')).toBeNull();
  });

  it('leaves a failure the server named no field for to whoever owns the key', async () => {
    const note = seedNote(0);

    renderScopedField(note.id, note.title, note.updatedAt);

    act(() => {
      const call = optimisticStore.begin(noteKey(note.id), {
        action: PENDING_ACTION.ADD,
        optimisticData: { title: 'Renamed' },
      });

      optimisticStore.settleFailure(noteKey(note.id), call, {
        error: { code: ACTION_ERROR.UNEXPECTED },
      });
    });

    await screen.findByText('Renamed');
    // The row around this field renders it once; a second copy here is the bug.
    expectNothingAnnounced();
  });

  it('renders a failure the server did name this field for', async () => {
    const note = seedNote(0);

    renderScopedField(note.id, note.title, note.updatedAt);

    act(() => {
      const call = optimisticStore.begin(noteKey(note.id), {
        action: PENDING_ACTION.UPDATE,
        optimisticData: { title: 'Renamed' },
        fields: ['title'],
      });

      optimisticStore.settleFailure(noteKey(note.id), call, {
        error: { code: ACTION_ERROR.INVALID_INPUT, fields: { title: ['too short'] } },
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(errorCopy.invalidInput);
  });
});
