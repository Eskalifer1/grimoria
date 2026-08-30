/**
 * Postgres's `unique_violation`: a unique index or a primary key already holds
 * the value the insert carried.
 */
const UNIQUE_VIOLATION = '23505';

/** Reads a property off an unknown object without asserting a shape onto it. */
function readProperty(value: object, key: string): unknown {
  return key in value ? Reflect.get(value, key) : undefined;
}

/**
 * Whether a thrown value is Postgres refusing a duplicate, at any depth of
 * `cause` — Payload and Drizzle each wrap the driver's error before it surfaces.
 *
 * `seen` is not defensive: an ORM that attaches the original error as the cause
 * of its own wrapper can close the chain into a loop.
 */
function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<object>();
  let current: unknown = error;

  while (typeof current === 'object' && current !== null && !seen.has(current)) {
    seen.add(current);

    if (readProperty(current, 'code') === UNIQUE_VIOLATION) {
      return true;
    }

    current = readProperty(current, 'cause');
  }

  return false;
}

export { isUniqueViolation, UNIQUE_VIOLATION };
