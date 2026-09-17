import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { getSessionUser } from '@/api/core/session';
import { recordTag } from '@/constants/cacheTags';
import type { User } from '@/payload-types';

/** What a profile surface renders. Not the Payload document, which carries the auth internals. */
type CurrentUser = Pick<User, 'id' | 'name' | 'email' | 'updatedAt'>;

/**
 * The signed-in User, or `null` for a Guest.
 *
 * Reads through Payload's Local API in-process — no HTTP round trip — and shares the
 * request's cached session read, so a layout and its page pay for one lookup.
 * `'use cache: private'` keeps this in the browser's per-User router cache only,
 * never a shared server store, so one User's session can never answer another's read.
 * Tagged with the record, so `updateName`'s `updateTag` drops exactly this entry.
 */
async function getCurrentUser(): Promise<CurrentUser | null> {
  'use cache: private';

  cacheLife('hours');

  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  cacheTag(recordTag('users', user.id));

  return { id: user.id, name: user.name, email: user.email, updatedAt: user.updatedAt };
}

export type { CurrentUser };
export { getCurrentUser };
