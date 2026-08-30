import { z } from 'zod';

import { noteBodySchema, noteIdSchema, noteTitleSchema } from '../noteFields';

/**
 * Input contract of the mock `createNote`. Its own file rather than beside the
 * action: a `"use server"` file may export async functions only.
 *
 * The id comes from the caller (ADR-0010) — the server never mints one, which is
 * what makes an optimistic create addressable before it is confirmed.
 */
const createNoteSchema = z.object({
  id: noteIdSchema,
  title: noteTitleSchema,
  body: noteBodySchema.optional(),
  done: z.boolean().optional(),
});

export { createNoteSchema };
