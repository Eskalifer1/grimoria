import type { CollectionConfig, Field } from 'payload';

import { DEFAULT_THEME, THEMES } from '@/constants/theme';
import { PROFILE_SLUG_MAX_BASE_LENGTH, PROFILE_SLUG_SUFFIX_LENGTH } from '@/constants/user';

/**
 * A profile slug that reads as the User's name and still collides with nobody:
 * two people called "Ann Lee" are `ann-lee-k3x9q` and `ann-lee-7wq2m`. A name
 * with no Latin letters — Cyrillic, CJK — leaves the base empty and falls back
 * to `user`, so the suffix carries the whole identity.
 */
function buildProfileSlug(name: unknown): string {
  const base = (typeof name === 'string' ? name : '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, PROFILE_SLUG_MAX_BASE_LENGTH);

  const suffix = Math.random()
    .toString(36)
    .slice(2, 2 + PROFILE_SLUG_SUFFIX_LENGTH);

  return `${base || 'user'}-${suffix}`;
}

const themeField: Field = {
  name: 'theme',
  type: 'select',
  options: [...THEMES],
  defaultValue: DEFAULT_THEME,
  admin: {
    description: "Decides the User's Theme; the cookie answers for Guests only",
  },
};

const slugField: Field = {
  name: 'slug',
  type: 'text',
  unique: true,
  admin: {
    description: 'Addresses the public profile. Generated on create, editable later (#5)',
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) =>
        typeof value === 'string' && value.length > 0 ? value : buildProfileSlug(data?.name),
    ],
  },
};

/**
 * Payload-only additions to the collection `payload-auth` generates. Better
 * Auth knows nothing about either field, which is why neither reaches its
 * session — `resolveTheme()` reads the Theme through `payload.auth()`.
 */
function withProfileFields({ collection }: { collection: CollectionConfig }): CollectionConfig {
  return {
    ...collection,
    fields: [...collection.fields, themeField, slugField],
  };
}

export { withProfileFields };
