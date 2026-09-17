import { revalidateTag } from 'next/cache';

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload';

import {
  collectionTag,
  isTaggedCollection,
  recordTag,
  type TaggedCollection,
} from '@/constants/cacheTags';

/**
 * Purges the record's cached reads and the collection's lists. Payload hooks
 * also run from `yarn seed` and migrations, outside any Next request, where
 * `revalidateTag` throws — a purge failing there is logged, never rethrown,
 * since the row is already written.
 */
function purgeCacheTags(
  collection: TaggedCollection,
  id: string | number,
  req: PayloadRequest,
): void {
  try {
    revalidateTag(recordTag(collection, String(id)), 'max');
    revalidateTag(collectionTag(collection), 'max');
  } catch (error) {
    req.payload.logger.error(
      { collection, id, err: error },
      'Cache tag revalidation failed after a collection write',
    );
  }
}

/**
 * Appends `afterChange` and `afterDelete` hooks that purge the record's and the
 * collection's tags, so an admin edit in `/cms` drops every *shared* read
 * (`'use cache'`, `remote`) of them. A `private` read lives in the User's own
 * browser, which no server call reaches — its `stale` is the only bound there.
 *
 * @throws Error at config time when the collection has no tag prefix
 */
function withCacheTagHooks(collection: CollectionConfig): CollectionConfig {
  const tagged = collection.slug;

  if (!isTaggedCollection(tagged)) {
    throw new Error(`Collection "${tagged}" has no cache tag prefix`);
  }

  // One body serves both events — a change and a delete stale the same two tags.
  const purge: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({ doc, req }) => {
    purgeCacheTags(tagged, doc.id, req);

    return doc;
  };

  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [...(collection.hooks?.afterChange ?? []), purge],
      afterDelete: [...(collection.hooks?.afterDelete ?? []), purge],
    },
  };
}

export { withCacheTagHooks };
