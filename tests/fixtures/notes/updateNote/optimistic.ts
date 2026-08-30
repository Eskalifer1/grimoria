import type { z } from 'zod';

import { PENDING_ACTION } from '@/constants/optimistic';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

import type { MockNote } from '../mockDatabase';
import { noteKey } from '../noteOptimisticKeys';
import type { updateNoteSchema } from './contract';
import { updateNote } from './index';

/**
 * One key per note, whichever field is being written. The input is named rather
 * than inferred: `key` reads `id` alone, and left to infer, that is the whole of
 * the input a hook would then be allowed to name a field from.
 */
const updateNoteOptimistic = optimisticDescriptor<z.input<typeof updateNoteSchema>, MockNote>({
  run: updateNote,
  pending: PENDING_ACTION.UPDATE,
  key: (input) => noteKey(input.id),
  value: (data) => ({ title: data.title, body: data.body, done: data.done }),
  version: (data) => data.updatedAt,
});

export { updateNoteOptimistic };
