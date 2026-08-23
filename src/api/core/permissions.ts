import 'server-only';

import { ROLE, type Role } from '@/constants/role';
import type { User } from '@/payload-types';

/**
 * Whether a User holds a role. `role` is a list on the document, so this is the
 * only correct way to ask, and passing it a `Role` is what pins `constants/role.ts`
 * to the values the collection accepts — a role that drifts fails `tsc` here.
 */
function hasRole(user: User, role: Role): boolean {
  return user.role?.includes(role) ?? false;
}

/** Whether a User may act on records that are not their own. */
function isAdmin(user: User): boolean {
  return hasRole(user, ROLE.ADMIN);
}

export { hasRole, isAdmin };
