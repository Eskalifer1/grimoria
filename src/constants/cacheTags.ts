/**
 * The collections whose records are cached and tagged, each with the singular
 * prefix its record tag opens with. A collection is added here the day a
 * cached read of it exists — `notes` is not one yet.
 */
const RECORD_TAG_PREFIX = {
  users: 'user',
} as const;

type TaggedCollection = keyof typeof RECORD_TAG_PREFIX;

/** Narrows a slug that came from a Payload config to a collection with tags. */
function isTaggedCollection(slug: string): slug is TaggedCollection {
  return slug in RECORD_TAG_PREFIX;
}

/**
 * The tag every cached list of a collection carries — `'users'`. A write to any
 * record of the collection names it, so a list showing the record refreshes.
 */
function collectionTag(collection: TaggedCollection): string {
  return collection;
}

/**
 * The tag one record's cached reads carry — `'user:42'`. It is also the key the
 * optimistic store addresses the record by, so the overlay and the cache agree
 * on one string by construction rather than by convention.
 */
function recordTag(collection: TaggedCollection, id: string): string {
  return `${RECORD_TAG_PREFIX[collection]}:${id}`;
}

export type { TaggedCollection };
export { collectionTag, isTaggedCollection, recordTag };
