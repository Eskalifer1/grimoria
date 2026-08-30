import { describe, expect, it } from 'vitest';

import { isUniqueViolation } from '@/api/core/uniqueViolation';

/** What `pg` throws: a plain `Error` carrying the Postgres error code on `code`. */
function pgError(code: string): Error {
  return Object.assign(new Error('duplicate key value violates unique constraint'), { code });
}

describe('isUniqueViolation', () => {
  it('recognizes Postgres 23505', () => {
    expect(isUniqueViolation(pgError('23505'))).toBe(true);
  });

  it('finds it under the wrappers an ORM puts around it', () => {
    const wrapped = new Error('Something went wrong', {
      cause: new Error('drizzle', { cause: pgError('23505') }),
    });

    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it('reads the code off a plain object, since not every driver throws an Error', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('leaves a foreign-key violation alone', () => {
    expect(isUniqueViolation(pgError('23503'))).toBe(false);
  });

  it('leaves an ordinary throw alone', () => {
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });

  it('survives a cause that points back at itself', () => {
    const looping: { code: string; cause?: unknown } = { code: '23503' };
    looping.cause = looping;

    expect(isUniqueViolation(looping)).toBe(false);
  });
});
