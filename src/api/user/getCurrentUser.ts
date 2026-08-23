import 'server-only';

import { getSessionUser } from '@/api/core/session';
import type { User } from '@/payload-types';

/** What a profile surface renders. Not the Payload document, which carries the auth internals. */
type CurrentUser = Pick<User, 'id' | 'name' | 'email'>;

/**
 * The signed-in User, or `null` for a Guest.
 *
 * Reads through Payload's Local API in-process — no REST or GraphQL round trip —
 * and shares the request's cached session read, so a layout and its page pay for
 * one lookup. Reading a session opts the caller out of static rendering.
 */
async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email };
}

export type { CurrentUser };
export { getCurrentUser };
