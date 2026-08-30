import { describe, expect, it } from 'vitest';

import { newId } from '@/shared/lib/newId';

import { listSourceFiles, readSource, toRepoPath } from '../../fixtures/sourceTree';

/** RFC 4122 version 4: the `4` in the third group, `8`–`b` opening the fourth. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('returns a v4 UUID', () => {
    expect(newId()).toMatch(UUID_V4);
  });

  it('returns a different id every call', () => {
    const ids = new Set(Array.from({ length: 100 }, newId));

    expect(ids.size).toBe(100);
  });

  it('still mints one where randomUUID is missing, as it is outside a secure context', () => {
    const secure = crypto.randomUUID;

    // A dev build reached over a LAN address has `crypto` without `randomUUID`,
    // and the first optimistic write would otherwise throw rather than save.
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });

    try {
      expect(newId()).toMatch(UUID_V4);
      expect(new Set(Array.from({ length: 100 }, newId)).size).toBe(100);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: secure });
    }
  });

  it('is the only call to crypto.randomUUID in src/', () => {
    const callers = listSourceFiles()
      .filter((file) => readSource(file).includes('randomUUID'))
      .map(toRepoPath);

    // Swapping v4 for UUIDv7 has to stay a one-file edit (ADR-0010).
    expect(callers).toEqual(['src/shared/lib/newId.ts']);
  });
});
