import { z } from 'zod';

import { noteBodySchema, noteIdSchema, noteTitleSchema } from '../noteFields';

/** Input contract of the mock `updateNote`: the id, plus whichever fields are being written. */
const updateNoteSchema = z.object({
  id: noteIdSchema,
  title: noteTitleSchema.optional(),
  body: noteBodySchema.optional(),
  done: z.boolean().optional(),
});

export { updateNoteSchema };
