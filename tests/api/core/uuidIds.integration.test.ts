import config from '@payload-config';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { isUniqueViolation } from '@/api/core/uniqueViolation';
import { newId } from '@/shared/lib/newId';

/**
 * The two facts about ADR-0010 that only a real database can settle: the id the
 * browser minted is the id Postgres stores, and repeating one is refused rather
 * than folded into an update.
 *
 * `yarn test` must stay runnable without a database, and Vitest does not read
 * `.env`, so this whole file skips unless a connection string is handed in —
 * `yarn test:integration` is what supplies one.
 */
const connected = (process.env.DATABASE_URL ?? '') !== '';

describe.skipIf(!connected)('UUID primary keys', () => {
  let payload: Payload;
  const written: string[] = [];

  async function createUser(id: string, name: string) {
    return payload.create({
      collection: 'users',
      data: { id, name, email: `${id}@uuid.test`, emailVerified: false },
    });
  }

  beforeAll(async () => {
    payload = await getPayload({ config });
  });

  // Guarded on `payload` itself: a database still holding the pre-ADR-0010 schema
  // fails `beforeAll`, and an unguarded teardown then buries that error under its own.
  afterAll(async () => {
    for (const id of written) {
      await payload?.delete({ collection: 'users', id }).catch(() => undefined);
    }

    await payload?.destroy?.();
  });

  it('stores the id the client supplied', async () => {
    const id = newId();
    written.push(id);

    const user = await createUser(id, 'Client-minted');

    // The assertion that catches `allowIDOnCreate` going missing in a later
    // config edit: without it Postgres silently allocates an id of its own.
    expect(user.id).toBe(id);
    expect(typeof user.id).toBe('string');
  });

  it('refuses a second row under an id already taken, and leaves the first alone', async () => {
    const id = newId();
    written.push(id);

    await createUser(id, 'First');

    // A different email, so the only thing colliding is the primary key.
    const repeat = payload.create({
      collection: 'users',
      data: { id, name: 'Second', email: `${newId()}@uuid.test`, emailVerified: false },
    });

    const thrown = await repeat.then(
      () => null,
      (error: unknown) => error,
    );

    expect(thrown).not.toBeNull();
    expect(isUniqueViolation(thrown)).toBe(true);

    const survivor = await payload.findByID({ collection: 'users', id });

    expect(survivor.name).toBe('First');
  });
});
