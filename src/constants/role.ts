/**
 * Every role a User may hold. The values mirror the `role` field on the `users`
 * collection (ADR-0003) — `src/api/core/permissions.ts` fails `tsc` if the two
 * drift — and are read through this object rather than written as literals, so
 * a role rename is one edit and a typo is a compile error.
 *
 * `role` is an array on the document: a User holds several. Ask
 * `hasRole`/`isAdmin` in `src/api/core/permissions.ts`, never `user.role === …`.
 */
const ROLE = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

type Role = (typeof ROLE)[keyof typeof ROLE];

export type { Role };
export { ROLE };
