import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireSessionUser } from '@/api/core/session';
import { updateName } from '@/api/user/updateName';
import { updateNameSchema } from '@/api/user/updateNameContract';
import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { USER_NAME_MAX_LENGTH } from '@/constants/user';
import type { User } from '@/payload-types';
import { ActionError } from '@/shared/lib/actionError';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/api/core/session', () => ({ getSessionUser: vi.fn(), requireSessionUser: vi.fn() }));

const update = vi.fn();
const payloadClient = { update, logger: { debug: vi.fn(), error: vi.fn() } };

vi.mock('@/api/core/payloadClient', () => ({ getPayloadClient: async () => payloadClient }));

const user = { id: 7, email: 'merlin@example.com', role: ['user'] } as unknown as User;

describe('updateNameSchema', () => {
  it('rejects an empty name', () => {
    expect(updateNameSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    expect(updateNameSchema.safeParse({ name: '   \t\n ' }).success).toBe(false);
  });

  it('rejects a name one character over the limit', () => {
    const tooLong = 'a'.repeat(USER_NAME_MAX_LENGTH + 1);

    expect(updateNameSchema.safeParse({ name: tooLong }).success).toBe(false);
  });

  it('accepts a name exactly at the limit', () => {
    const atLimit = 'a'.repeat(USER_NAME_MAX_LENGTH);
    const result = updateNameSchema.safeParse({ name: atLimit });

    expect(result).toEqual({ success: true, data: { name: atLimit } });
  });

  it('accepts a valid name and hands back the trimmed value', () => {
    const result = updateNameSchema.safeParse({ name: '  Merlin  ' });

    expect(result).toEqual({ success: true, data: { name: 'Merlin' } });
  });

  it('rejects a missing name field', () => {
    expect(updateNameSchema.safeParse({}).success).toBe(false);
  });

  it('measures the limit after trimming', () => {
    const padded = ` ${'a'.repeat(USER_NAME_MAX_LENGTH)} `;

    expect(updateNameSchema.safeParse({ name: padded }).success).toBe(true);
  });
});

describe('updateName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSessionUser).mockResolvedValue(user);
    update.mockResolvedValue({ name: 'Morgan' });
  });

  it('writes the session User under the collection\u2019s own access control', async () => {
    const result = await updateName({ name: 'Morgan' });

    expect(result).toEqual({
      status: ACTION_STATUS.SUCCESS,
      data: { name: 'Morgan' },
      error: null,
    });
    expect(update).toHaveBeenCalledWith({
      collection: 'users',
      id: user.id,
      data: { name: 'Morgan' },
      overrideAccess: false,
      user,
    });
  });

  it('cannot be aimed at another User', async () => {
    // Not a literal, so `tsc` lets the extra key through — the same shape a hand-rolled
    // request carries. The action has no id parameter, so it can only reach the session User.
    const hostileInput = { name: 'Morgan', id: 999 };

    await updateName(hostileInput);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }));
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ id: 999 }));
  });

  it('refuses a Guest', async () => {
    vi.mocked(requireSessionUser).mockRejectedValue(new ActionError(ACTION_ERROR.UNAUTHENTICATED));

    expect((await updateName({ name: 'Morgan' })).error?.code).toBe(ACTION_ERROR.UNAUTHENTICATED);
    expect(update).not.toHaveBeenCalled();
  });
});
