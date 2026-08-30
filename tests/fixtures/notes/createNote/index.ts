import { ACTION_ERROR } from '@/constants/action';
import { ActionError } from '@/shared/lib/actionError';

import { createMockAction } from '../createMockAction';
import { type MockNote, nextMockTimestamp } from '../mockDatabase';
import { createNoteSchema } from './contract';

/**
 * Stores a note under the id the client sent. An id already present is a
 * `CONFLICT` and leaves the existing row alone — ADR-0010's rule, proved here
 * before the Postgres unique index enforces it.
 */
const createNote = createMockAction({
  name: 'mock.notes.create',
  schema: createNoteSchema,
  handler: async ({ input, notes }) => {
    if (notes.has(input.id)) {
      throw new ActionError(ACTION_ERROR.CONFLICT, { message: 'id already taken' });
    }

    const note: MockNote = {
      id: input.id,
      title: input.title,
      body: input.body ?? '',
      done: input.done ?? false,
      updatedAt: nextMockTimestamp(),
    };

    notes.set(note.id, note);

    return { ...note };
  },
});

export { createNote };
