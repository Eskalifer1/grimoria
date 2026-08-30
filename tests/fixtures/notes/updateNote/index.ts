import { ACTION_ERROR } from '@/constants/action';
import { ActionError } from '@/shared/lib/actionError';

import { createMockAction } from '../createMockAction';
import { type MockNote, nextMockTimestamp } from '../mockDatabase';
import { updateNoteSchema } from './contract';

/** Writes the fields it was sent onto an existing note. An unknown id is `NOT_FOUND`. */
const updateNote = createMockAction({
  name: 'mock.notes.update',
  schema: updateNoteSchema,
  handler: async ({ input, notes }) => {
    const existing = notes.get(input.id);

    if (existing === undefined) {
      throw new ActionError(ACTION_ERROR.NOT_FOUND, { message: 'no note under that id' });
    }

    const updated: MockNote = {
      ...existing,
      title: input.title ?? existing.title,
      body: input.body ?? existing.body,
      done: input.done ?? existing.done,
      updatedAt: nextMockTimestamp(),
    };

    notes.set(updated.id, updated);

    return { ...updated };
  },
});

export { updateNote };
