import { z } from 'zod';

import { USER_NAME_MAX_LENGTH } from '@/constants/user';
import { VALIDATION_ERROR } from '@/constants/validation';
import { validationMessage } from '@/shared/lib/validationMessage';

/**
 * Input contract of the `updateName` action. Its own file rather than beside the
 * action in `index.ts`: a `"use server"` file may export async functions only, so
 * a schema — or a type — declared there breaks the module.
 *
 * Trims before it measures, so a padded name is saved trimmed and a
 * whitespace-only name fails as empty.
 *
 * Its messages are catalog keys rather than English, so the rule and its wording
 * stay in one place and the same schema still guards the server
 * (`docs/features/forms.md`).
 */
const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, validationMessage(VALIDATION_ERROR.REQUIRED))
    .max(USER_NAME_MAX_LENGTH, validationMessage(VALIDATION_ERROR.TOO_LONG, USER_NAME_MAX_LENGTH)),
});

export { updateNameSchema };
