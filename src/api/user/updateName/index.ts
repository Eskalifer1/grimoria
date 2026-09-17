'use server';

import { createProtectedAction } from '@/api/core/createAction';
import { collectionTag, recordTag } from '@/constants/cacheTags';

import { updateNameSchema } from './contract';

/**
 * Renames the signed-in User and refreshes every surface cached under their tag.
 *
 * The record written is the one on the session — there is no id parameter, so no
 * caller can aim this at somebody else — and `overrideAccess: false` runs the
 * collection's own access control on top.
 *
 * The answer carries `updatedAt` as well as the name, which is what dates the
 * optimistic entry against later renders (`./optimistic.ts`).
 *
 * Session, parsing, error mapping and the tag refresh are the wrapper's
 * (`src/api/core/createAction.ts`); a failure comes back as a code.
 */
const updateName = createProtectedAction({
  name: 'user.updateName',
  schema: updateNameSchema,
  tags: ({ user }) => [recordTag('users', user.id), collectionTag('users')],
  handler: async ({ input, user, payload }) => {
    const updated = await payload.update({
      collection: 'users',
      id: user.id,
      data: { name: input.name },
      overrideAccess: false,
      user,
    });

    return { name: updated.name, updatedAt: updated.updatedAt };
  },
});

export { updateName };
