import { describe, expect, it } from 'vitest';

import { hasRole, isAdmin } from '@/api/core/permissions';
import { ROLE } from '@/constants/role';
import type { User } from '@/payload-types';

function userWith(role: User['role'], id = 1): User {
  return { id, role, name: 'Merlin', email: 'merlin@example.com' } as User;
}

describe('permissions', () => {
  it('reads a role out of the list a User holds', () => {
    const user = userWith([ROLE.USER, ROLE.MODERATOR]);

    expect(hasRole(user, ROLE.MODERATOR)).toBe(true);
    expect(hasRole(user, ROLE.ADMIN)).toBe(false);
  });

  it('treats a missing role list as holding nothing', () => {
    expect(hasRole(userWith(null), ROLE.USER)).toBe(false);
    expect(isAdmin(userWith(undefined))).toBe(false);
  });

  it('reads admin out of the same list', () => {
    expect(isAdmin(userWith([ROLE.USER, ROLE.ADMIN]))).toBe(true);
    expect(isAdmin(userWith([ROLE.MODERATOR]))).toBe(false);
  });
});
