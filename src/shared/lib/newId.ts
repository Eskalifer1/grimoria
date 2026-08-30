/** RFC 4122 v4, as `randomUUID` spells it. */
const UUID_TEMPLATE = '10000000-1000-4000-8000-100000000000';

/**
 * `crypto.randomUUID` exists in secure contexts only, so a dev build reached
 * over a LAN address has `crypto` without it. Built from `getRandomValues`
 * there, which every context has, rather than crashing the first write.
 */
function randomUuid(): string {
  return UUID_TEMPLATE.replaceAll(/[018]/g, (character) => {
    const digit = Number(character);
    const random = crypto.getRandomValues(new Uint8Array(1))[0] ?? 0;

    return (digit ^ (random & (15 >> (digit / 4)))).toString(16);
  });
}

/**
 * Mints the id a record is addressed by, on the client, before the write is sent
 * (ADR-0010). One place, so swapping v4 for UUIDv7 is a one-file edit — which is
 * why nothing else in `src/` may call `crypto.randomUUID` directly.
 */
function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomUuid();
}

export { newId };
