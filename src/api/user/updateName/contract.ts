import { z } from 'zod';

import { USER_NAME_MAX_LENGTH } from '@/constants/user';

/**
 * Input contract of the `updateName` action. Its own file rather than beside the
 * action in `index.ts`: a `"use server"` file may export async functions only, so
 * a schema — or a type — declared there breaks the module.
 *
 * Trims before it measures, so a padded name is saved trimmed and a
 * whitespace-only name fails as empty.
 */
const updateNameSchema = z.object({
  name: z.string().trim().min(1).max(USER_NAME_MAX_LENGTH),
});

export { updateNameSchema };
