import { ACTION_ERROR } from '@/constants/action';
import { ActionError } from '@/shared/lib/actionError';

import { createMockAction } from '../createMockAction';
import { deleteNoteSchema } from './contract';

/** Removes a note. An unknown id is `NOT_FOUND`, so a double delete reads as one. */
const deleteNote = createMockAction({
  name: 'mock.notes.delete',
  schema: deleteNoteSchema,
  handler: async ({ input, notes }) => {
    if (!notes.delete(input.id)) {
      throw new ActionError(ACTION_ERROR.NOT_FOUND, { message: 'no note under that id' });
    }

    return { id: input.id };
  },
});

export { deleteNote };
