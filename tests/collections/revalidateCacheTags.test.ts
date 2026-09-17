import { revalidateTag } from 'next/cache';

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withCacheTagHooks } from '@/collections/revalidateCacheTags';
import { withProfileFields } from '@/collections/users';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const logger = { error: vi.fn() };
const doc = { id: '42' };

// The hooks read `doc` and `req` alone; the cast keeps the rest of Payload's args out of view.
const hookInput = { doc, req: { payload: { logger } } };
const changeArgs = hookInput as unknown as Parameters<CollectionAfterChangeHook>[0];
const deleteArgs = hookInput as unknown as Parameters<CollectionAfterDeleteHook>[0];

function hooksOf(collection: CollectionConfig) {
  const afterChange = collection.hooks?.afterChange?.[0];
  const afterDelete = collection.hooks?.afterDelete?.[0];

  if (!afterChange || !afterDelete) throw new Error('the collection carries no cache tag hooks');

  return { afterChange, afterDelete };
}

describe('withCacheTagHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const bare = { slug: 'users', fields: [] } as unknown as CollectionConfig;

  it('purges the record tag and the collection tag after a change', async () => {
    const { afterChange } = hooksOf(withCacheTagHooks(bare));

    await afterChange(changeArgs);

    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['user:42', 'max'],
      ['users', 'max'],
    ]);
  });

  it('purges the same two tags after a delete', async () => {
    const { afterDelete } = hooksOf(withCacheTagHooks(bare));

    await afterDelete(deleteArgs);

    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['user:42', 'max'],
      ['users', 'max'],
    ]);
  });

  it('refuses a collection with no tag prefix at config time', () => {
    const untagged = { slug: 'sessions', fields: [] } as unknown as CollectionConfig;

    expect(() => withCacheTagHooks(untagged)).toThrow('sessions');
  });

  it('hands the doc back unchanged', async () => {
    const { afterChange } = hooksOf(withCacheTagHooks(bare));

    expect(await afterChange(changeArgs)).toBe(doc);
  });

  it('logs and carries on when revalidation throws outside a request', async () => {
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error('static generation store missing');
    });
    const { afterChange } = hooksOf(withCacheTagHooks(bare));

    expect(await afterChange(changeArgs)).toBe(doc);
    expect(logger.error).toHaveBeenCalled();
  });

  it('keeps the hooks the collection already had', () => {
    const existing = vi.fn();
    const collection = { ...bare, hooks: { afterChange: [existing] } };

    const { afterChange } = collection.hooks;
    expect(withCacheTagHooks(collection).hooks?.afterChange).toEqual([
      ...afterChange,
      expect.any(Function),
    ]);
  });
});

describe('withProfileFields', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset();
  });

  it('registers the cache tag hooks on users', async () => {
    const { afterChange, afterDelete } = hooksOf(
      withProfileFields({
        collection: { slug: 'users', fields: [] } as unknown as CollectionConfig,
      }),
    );

    await afterChange(changeArgs);
    await afterDelete(deleteArgs);

    expect(revalidateTag).toHaveBeenCalledTimes(4);
  });
});
