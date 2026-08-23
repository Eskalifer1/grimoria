import 'server-only';

import { headers } from 'next/headers';
import { cache } from 'react';

import { getPayloadClient } from '@/api/core/payloadClient';
import { ACTION_ERROR } from '@/constants/action';
import type { User } from '@/payload-types';
import { ActionError } from '@/shared/lib/actionError';

/**
 * The Payload document of the signed-in User, or `null` for a Guest.
 *
 * The one place a session is read. `cache()`d per request, so every read and
 * every action on one request pays for a single lookup, and reading it opts the
 * caller out of static rendering. It does not extend the session
 * (`docs/features/auth.md`).
 */
const getSessionUser = cache(async (): Promise<User | null> => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });

  return user ?? null;
});

/**
 * The signed-in User, or a thrown `ActionError` carrying `UNAUTHENTICATED`.
 *
 * For code already inside an action wrapper, which turns the throw into the
 * failure member. A Server Component redirects on `getSessionUser()` instead —
 * a throw there is a 500, not a sign-in prompt.
 *
 * @throws ActionError when the caller is a Guest
 */
async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();

  if (user === null) {
    throw new ActionError(ACTION_ERROR.UNAUTHENTICATED);
  }

  return user;
}

export { getSessionUser, requireSessionUser };
