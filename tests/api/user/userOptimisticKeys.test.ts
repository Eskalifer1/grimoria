import { describe, expect, it } from 'vitest';

import { userKey } from '@/api/user/userOptimisticKeys';

import { listSourceFiles, readSource, toRepoPath } from '../../fixtures/sourceTree';

const KEY_MODULE = 'src/api/user/userOptimisticKeys.ts';

/** A `user:` opening a string literal. Prose and an object property are not keys. */
const USER_KEY_LITERAL = /['"`]user:/;

describe('userKey', () => {
  it('addresses a User by a prefixed id', () => {
    expect(userKey('00000000-0000-4000-8000-000000000001')).toBe(
      'user:00000000-0000-4000-8000-000000000001',
    );
  });

  it('is the only file that spells the format', () => {
    const spelling = listSourceFiles()
      .filter((file) => USER_KEY_LITERAL.test(readSource(file)))
      .map(toRepoPath);

    // Two screens addressing one User differently is the single failure an
    // optimistic overlay cannot recover from, so the format has one author.
    expect(spelling).toEqual([KEY_MODULE]);
  });
});
