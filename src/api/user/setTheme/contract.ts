import { z } from 'zod';

import { THEMES } from '@/constants/theme';

/**
 * Input contract of the `setTheme` action. Its own file rather than beside the
 * action in `index.ts`: a `"use server"` file may export async functions only.
 * `THEMES` is the one list, so a Theme added there is accepted here without an edit.
 */
const setThemeSchema = z.object({
  theme: z.enum(THEMES),
});

export { setThemeSchema };
