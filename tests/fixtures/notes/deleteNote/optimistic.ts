import { PENDING_ACTION } from '@/constants/optimistic';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

import { noteKey } from '../noteOptimisticKeys';
import { deleteNote } from './index';

/** No `value`: a removed row has nothing left to overlay, only flight state and a failure. */
const deleteNoteOptimistic = optimisticDescriptor({
  run: deleteNote,
  pending: PENDING_ACTION.DELETE,
  key: (input) => noteKey(input.id),
});

export { deleteNoteOptimistic };
