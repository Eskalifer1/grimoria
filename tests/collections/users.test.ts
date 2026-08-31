import type { CollectionConfig, FieldHook } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { buildProfileSlug, normalizeProfileSlug, withProfileFields } from '@/collections/users';
import {
  PROFILE_SLUG_MAX_ATTEMPTS,
  PROFILE_SLUG_MAX_BASE_LENGTH,
  PROFILE_SLUG_SUFFIX_LENGTH,
} from '@/constants/user';

// cspell:ignore Анна José Müller ller

describe('normalizeProfileSlug', () => {
  it('collapses punctuation and trims the separators it leaves behind', () => {
    expect(normalizeProfileSlug('  !!Ann   Lee!!  ')).toBe('ann-lee');
  });

  it('normalizes a name with no Latin letters to nothing', () => {
    expect(normalizeProfileSlug('李明')).toBe('');
    expect(normalizeProfileSlug('Анна Лі')).toBe('');
    expect(normalizeProfileSlug('   ')).toBe('');
  });

  it('folds an accent into its own character, which then reads as a separator', () => {
    expect(normalizeProfileSlug('José Müller')).toBe('jose-mu-ller');
  });

  it('cuts a name longer than the limit down to exactly the limit', () => {
    const tooLong = 'a'.repeat(PROFILE_SLUG_MAX_BASE_LENGTH + 10);

    expect(normalizeProfileSlug(tooLong)).toHaveLength(PROFILE_SLUG_MAX_BASE_LENGTH);
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
    expect(buildProfileSlug('Анна Лі')).toMatch(/^user-[a-z0-9]+$/);
  });

  it('ends in a suffix of exactly the configured length', () => {
    const suffix = buildProfileSlug('Ann Lee').split('-').at(-1);

    expect(suffix).toMatch(new RegExp(`^[a-z0-9]{${PROFILE_SLUG_SUFFIX_LENGTH}}$`));
  });
});

function slugBeforeValidate(): FieldHook {
  const collection = { slug: 'users', fields: [] } as unknown as CollectionConfig;
  const field = withProfileFields({ collection }).fields.find(
    (candidate) => 'name' in candidate && candidate.name === 'slug',
  );
  const hook = field && 'hooks' in field ? field.hooks?.beforeValidate?.[0] : undefined;

  if (!hook) throw new Error('the slug field carries no beforeValidate hook');

  return hook;
}

function hookArgs({ count, name, value }: { count: unknown; name?: unknown; value?: unknown }) {
  return {
    data: { name },
    req: { payload: { count } },
    value,
  } as unknown as Parameters<FieldHook>[0];
}

describe('the slug field beforeValidate hook', () => {
  it('keeps a supplied slug, in normalized form, without asking the database', async () => {
    const count = vi.fn();

    await expect(
      slugBeforeValidate()(hookArgs({ count, value: '  !!Ann   Lee!!  ' })),
    ).resolves.toBe('ann-lee');
    expect(count).not.toHaveBeenCalled();
  });

  it('replaces a supplied slug that addresses nobody with a generated one', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 });

    await expect(
      slugBeforeValidate()(hookArgs({ count, name: 'Ann Lee', value: '   ' })),
    ).resolves.toMatch(/^ann-lee-[a-z0-9]+$/);
  });

  it('re-rolls a candidate the database already holds', async () => {
    const count = vi
      .fn()
      .mockResolvedValueOnce({ totalDocs: 1 })
      .mockResolvedValueOnce({ totalDocs: 0 });

    await expect(slugBeforeValidate()(hookArgs({ count, name: 'Ann Lee' }))).resolves.toMatch(
      /^ann-lee-[a-z0-9]+$/,
    );
    expect(count).toHaveBeenCalledTimes(2);
  });

  it('hands the last candidate to the unique index once the attempts run out', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 1 });

    await expect(slugBeforeValidate()(hookArgs({ count, name: 'Ann Lee' }))).resolves.toMatch(
      /^ann-lee-[a-z0-9]+$/,
    );
    expect(count).toHaveBeenCalledTimes(PROFILE_SLUG_MAX_ATTEMPTS - 1);
  });
});
