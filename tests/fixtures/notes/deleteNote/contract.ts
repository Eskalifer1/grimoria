import { z } from 'zod';

import { noteIdSchema } from '../noteFields';

/** Input contract of the mock `deleteNote`. */
const deleteNoteSchema = z.object({
  id: noteIdSchema,
});

export { deleteNoteSchema };
