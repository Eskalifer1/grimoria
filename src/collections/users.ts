import type { CollectionConfig, Field, PayloadRequest } from 'payload';

import { DEFAULT_THEME, THEMES } from '@/constants/theme';
import {
  PROFILE_SLUG_MAX_ATTEMPTS,
  PROFILE_SLUG_MAX_BASE_LENGTH,
  PROFILE_SLUG_SUFFIX_LENGTH,
} from '@/constants/user';

/**
 * The one shape a slug may have, applied to generated and supplied values
 * alike. A string of nothing but punctuation or spaces normalizes to `''`,
 * which is what tells the caller it addresses nobody.
 */
function normalizeProfileSlug(value: unknown): string {
  return (
    (typeof value === 'string' ? value : '')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      // Truncation before trimming, not after: cutting at 40 can land on a
      // separator and put one back at the end.
      .slice(0, PROFILE_SLUG_MAX_BASE_LENGTH)
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * A profile slug that reads as the User's name and still collides with nobody:
 * two people called "Ann Lee" are `ann-lee-k3x9q` and `ann-lee-7wq2m`. A name
 * with no Latin letters — Cyrillic, CJK — leaves the base empty and falls back
 * to `user`, so the suffix carries the whole identity.
 */
function buildProfileSlug(name: unknown): string {
  const suffix = Math.random()
    .toString(36)
    .slice(2, 2 + PROFILE_SLUG_SUFFIX_LENGTH);

  return `${normalizeProfileSlug(name) || 'user'}-${suffix}`;
}

/**
 * The `unique` index is what actually decides — two sign-ups can pass this
 * check in the same millisecond. Re-rolling the suffix first is what keeps a
 * User from meeting a raw constraint error over a 1-in-60-million collision.
 */
async function pickProfileSlug(name: unknown, req: PayloadRequest): Promise<string> {
  let candidate = buildProfileSlug(name);

  for (let attempt = 1; attempt < PROFILE_SLUG_MAX_ATTEMPTS; attempt++) {
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      req,
      where: { slug: { equals: candidate } },
    });

    if (totalDocs === 0) break;
    candidate = buildProfileSlug(name);
  }

  return candidate;
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
      // A supplied slug is untrusted: `"  "` normalizes to nothing, and a slug
      // that addresses nobody is replaced rather than stored.
      async ({ data, req, value }) =>
        normalizeProfileSlug(value) || (await pickProfileSlug(data?.name, req)),
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

export { buildProfileSlug, normalizeProfileSlug, withProfileFields };
