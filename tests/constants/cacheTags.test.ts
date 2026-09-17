import { describe, expect, it } from 'vitest';

import { collectionTag, isTaggedCollection, recordTag } from '@/constants/cacheTags';

import { listSourceFiles, readSource, toRepoPath } from '../fixtures/sourceTree';

const TAG_MODULE = 'src/constants/cacheTags.ts';

/** A `user:` opening a string literal. Prose and an object property are not tags. */
const RECORD_TAG_LITERAL = /['"`]user:/;

describe('collectionTag', () => {
  it('names a list by its collection slug', () => {
    expect(collectionTag('users')).toBe('users');
  });
});

describe('recordTag', () => {
  it('addresses one record by the singular prefix and its id', () => {
    expect(recordTag('users', '42')).toBe('user:42');
  });

  it('is the only file that spells the format', () => {
    const spelling = listSourceFiles()
      .filter((file) => RECORD_TAG_LITERAL.test(readSource(file)))
      .map(toRepoPath);

    // The optimistic overlay key and the cache tag are the same string only
    // while both come from here; a hand-spelled copy is the drift this guards.
    expect(spelling).toEqual([TAG_MODULE]);
  });
});

describe('isTaggedCollection', () => {
  it('admits a collection with a record prefix and refuses the rest', () => {
    expect(isTaggedCollection('users')).toBe(true);
    expect(isTaggedCollection('sessions')).toBe(false);
  });
});
