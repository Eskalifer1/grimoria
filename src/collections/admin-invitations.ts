import type { CollectionConfig, Field } from 'payload';

import { ADMIN_INVITE_EXPIRES_IN } from '@/constants/user';

/**
 * `payload-auth` declares `expiresAt` required, then mints the first admin's
 * invite without it — so a database with no admin cannot bootstrap one, and
 * `/cms` answers 400 instead of the sign-up screen. A default closes it in the
 * app layer; the column is untouched, so no migration follows.
 */
function withInviteExpiry({ collection }: { collection: CollectionConfig }): CollectionConfig {
  const fields: Field[] = collection.fields.map((field) =>
    // `type` first: it narrows the union to the one field a spread can widen
    // back into.
    field.type === 'date' && field.name === 'expiresAt'
      ? { ...field, defaultValue: () => new Date(Date.now() + ADMIN_INVITE_EXPIRES_IN * 1000) }
      : field,
  );

  return { ...collection, fields };
}

export { withInviteExpiry };
