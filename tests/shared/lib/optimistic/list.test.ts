import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import { PENDING_ACTION, type PendingAction } from '@/constants/optimistic';
import type { OptimisticSnapshot } from '@/shared/lib/optimistic/entries';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { listRows } from '@/shared/lib/optimistic/list';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

const NOW = 1_700_000_000_000;

interface Note {
  id: string;
  title: string;
}

const keyOf = (note: Note) => `note:${note.id}`;

function opened(
  patch: Record<string, unknown>,
  action: PendingAction = PENDING_ACTION.UPDATE,
): OptimisticEntry {
  return beginEntry(null, { action, optimisticData: patch }, 1, NOW);
}

function refused(entry: OptimisticEntry): OptimisticEntry {
  const settled = settleFailureEntry(entry, { error: { code: ACTION_ERROR.CONFLICT } }, 1, NOW);

  if (settled === null) {
    throw new Error('the failure left nothing behind');
  }

  return settled;
}

describe('listRows', () => {
  it("overlays the store's patch on the server's row", () => {
    const entries: OptimisticSnapshot = { 'note:1': opened({ title: 'Typed' }) };
    const [row] = listRows(entries, [{ id: '1', title: 'Server' }], [], keyOf);

    expect(row?.item).toEqual({ id: '1', title: 'Typed' });
    expect(row?.pendingAction).toBe(PENDING_ACTION.UPDATE);
    expect(row?.isDraft).toBe(false);
  });

  it('puts a row the server has not confirmed at the top, as a draft', () => {
    const entries: OptimisticSnapshot = {
      'note:2': opened({ id: '2', title: 'New' }, PENDING_ACTION.ADD),
    };
    const rows = listRows(entries, [{ id: '1', title: 'Server' }], [], keyOf);

    expect(rows.map((row) => row.key)).toEqual(['note:2', 'note:1']);
    expect(rows[0]?.isDraft).toBe(true);
    expect(rows[0]?.item).toEqual({ id: '2', title: 'New' });
  });

  it('is not fooled by a field write on a row the list already holds', () => {
    // A changed-fields patch has no id, so rebuilding its key lands somewhere
    // else — which is the whole check between a draft and an ordinary write.
    const entries: OptimisticSnapshot = { 'note:9': opened({ title: 'Typed' }) };

    expect(listRows(entries, [], [], keyOf)).toEqual([]);
  });

  it('survives a patch the key format was never written for', () => {
    const throwing = (note: Note) => {
      if (!note.id) {
        throw new Error('no id');
      }

      return `note:${note.id}`;
    };

    expect(listRows({ 'user:1': opened({ name: 'X' }) }, [], [], throwing)).toEqual([]);
  });

  it('hides a row a removal has settled, and carries its failure otherwise', () => {
    const entries: OptimisticSnapshot = { 'note:1': refused(opened({ title: 'Typed' })) };
    const items = [{ id: '1', title: 'Server' }];

    expect(listRows(entries, items, ['note:1'], keyOf)).toEqual([]);
    expect(listRows(entries, items, [], keyOf)[0]?.error?.code).toBe(ACTION_ERROR.CONFLICT);
  });
});
