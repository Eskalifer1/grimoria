'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { after } from 'next/server';

import { createAction } from '@/api/core/createAction';
import { collectionTag, recordTag } from '@/constants/cacheTags';
import { THEME_COOKIE_NAME, THEME_COOKIE_OPTIONS } from '@/constants/theme';

import { setThemeSchema } from './contract';

/**
 * Switches the Theme this device renders, and remembers it on the profile when
 * there is one.
 *
 * The cookie is the answer: it is what `src/proxy.ts` reads, so it is written
 * first, for a Guest and a User alike, and the call returns without waiting on
 * the database. A signed-in User's record is updated after the response has
 * gone out, under the collection's own access control; a refusal or an outage
 * there is logged and costs the device nothing — the Theme is a preference,
 * and the next sign-in reconciles the two from whichever side moved.
 *
 * The tags are refreshed in the same deferred step, once the row is written,
 * so `updateTag` — action-phase only — is not an option; `revalidateTag` with
 * the `max` profile serves the stale row until the fresh one lands.
 */
const setTheme = createAction({
  name: 'user.setTheme',
  schema: setThemeSchema,
  handler: async ({ input, user, payload }) => {
    (await cookies()).set(THEME_COOKIE_NAME, input.theme, THEME_COOKIE_OPTIONS);

    if (user) {
      after(async () => {
        try {
          await payload.update({
            collection: 'users',
            id: user.id,
            data: { theme: input.theme },
            overrideAccess: false,
            user,
          });

          revalidateTag(recordTag('users', user.id), 'max');
          revalidateTag(collectionTag('users'), 'max');
        } catch (error) {
          payload.logger.error({ action: 'user.setTheme', err: error }, 'Profile Theme not saved');
        }
      });
    }

    return { theme: input.theme };
  },
});

export { setTheme };
