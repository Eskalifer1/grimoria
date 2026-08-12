import { describe, expect, it } from 'vitest';

import { buildProfileSlug, normalizeProfileSlug } from '@/collections/users';
import { PROFILE_SLUG_MAX_BASE_LENGTH } from '@/constants/user';

describe('normalizeProfileSlug', () => {
  it('collapses punctuation and trims the separators it leaves behind', () => {
    expect(normalizeProfileSlug('  !!Ann   Lee!!  ')).toBe('ann-lee');
  });

  it('normalizes a name with no Latin letters to nothing', () => {
    expect(normalizeProfileSlug('李明')).toBe('');
    expect(normalizeProfileSlug('   ')).toBe('');
  });

  it('normalizes a value that is not a string to nothing', () => {
    expect(normalizeProfileSlug(undefined)).toBe('');
    expect(normalizeProfileSlug(42)).toBe('');
  });

  it('leaves no separator behind when truncation cuts through one', () => {
    const cutAtASeparator = `${'a'.repeat(PROFILE_SLUG_MAX_BASE_LENGTH - 1)} b`;

    expect(normalizeProfileSlug(cutAtASeparator)).toBe(
      'a'.repeat(PROFILE_SLUG_MAX_BASE_LENGTH - 1),
    );
  });
});

describe('buildProfileSlug', () => {
  it('reads as the name, with a suffix that separates namesakes', () => {
    expect(buildProfileSlug('Ann Lee')).toMatch(/^ann-lee-[a-z0-9]+$/);
  });

  it('falls back to a bare suffix when the name normalizes to nothing', () => {
    expect(buildProfileSlug('李明')).toMatch(/^user-[a-z0-9]+$/);
  });
});
