/**
 * The only place the User key format is written. A key is built here and read
 * everywhere, so two screens writing the same User cannot address it differently
 * — which is the one failure an optimistic overlay cannot recover from.
 */
function userKey(id: string): string {
  return `user:${id}`;
}

export { userKey };
