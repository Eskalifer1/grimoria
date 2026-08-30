import { PENDING_ACTION } from '@/constants/optimistic';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

import { noteKey } from '../noteOptimisticKeys';
import { createNote } from './index';

/**
 * The insert is addressable before it is confirmed, because the client minted the
 * id (ADR-0010). Deleted with the mock; the descriptor shape outlives it.
 */
const createNoteOptimistic = optimisticDescriptor({
  run: createNote,
  pending: PENDING_ACTION.ADD,
  key: (input) => noteKey(input.id),
  value: (data) => ({ title: data.title, body: data.body, done: data.done }),
  version: (data) => data.updatedAt,
});

export { createNoteOptimistic };
