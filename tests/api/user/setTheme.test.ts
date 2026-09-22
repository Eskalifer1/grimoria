import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { after } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionUser } from '@/api/core/session';
import { setTheme } from '@/api/user/setTheme';
import { setThemeSchema } from '@/api/user/setTheme/contract';
import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import { collectionTag, recordTag } from '@/constants/cacheTags';
import { THEME, THEME_COOKIE_NAME, THEME_COOKIE_OPTIONS } from '@/constants/theme';
import type { User } from '@/payload-types';
import { ActionError } from '@/shared/lib/actionError';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/api/core/session', () => ({ getSessionUser: vi.fn(), requireSessionUser: vi.fn() }));

const update = vi.fn();
const logError = vi.fn();
const payloadClient = { update, logger: { debug: vi.fn(), error: logError } };

vi.mock('@/api/core/payloadClient', () => ({ getPayloadClient: async () => payloadClient }));

const setCookie = vi.fn();

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'merlin@example.com',
  role: ['user'],
} as unknown as User;

/** Runs what the action deferred, the way Next does once the response is out. */
async function flushAfter(): Promise<void> {
  for (const [task] of vi.mocked(after).mock.calls) {
    await (typeof task === 'function' ? task() : task);
  }
}

describe('setThemeSchema', () => {
  it('accepts every Theme that exists', () => {
    expect(setThemeSchema.safeParse({ theme: THEME.DARK_FANTASY })).toEqual({
      success: true,
      data: { theme: THEME.DARK_FANTASY },
    });
  });

  it('rejects a value outside THEMES', () => {
    expect(setThemeSchema.safeParse({ theme: 'sepia' }).success).toBe(false);
  });

  it('rejects a missing theme field', () => {
    expect(setThemeSchema.safeParse({}).success).toBe(false);
  });
});

describe('setTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({ set: setCookie } as unknown as Awaited<
      ReturnType<typeof cookies>
    >);
    vi.mocked(getSessionUser).mockResolvedValue(null);
    update.mockResolvedValue({ theme: THEME.DARK_FANTASY });
  });

  it('answers INVALID_INPUT for a value outside THEMES and touches nothing', async () => {
    const result = await setTheme({ theme: 'sepia' as never });

    expect(result.error?.code).toBe(ACTION_ERROR.INVALID_INPUT);
    expect(setCookie).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it('sets the cookie for a Guest with the options sign-in writes, and defers no write', async () => {
    const result = await setTheme({ theme: THEME.DARK_FANTASY });

    expect(result).toEqual({
      status: ACTION_STATUS.SUCCESS,
      data: { theme: THEME.DARK_FANTASY },
      error: null,
    });
    expect(setCookie).toHaveBeenCalledWith(
      THEME_COOKIE_NAME,
      THEME.DARK_FANTASY,
      THEME_COOKIE_OPTIONS,
    );
    expect(after).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('answers with the cookie set before the profile write runs', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);

    const result = await setTheme({ theme: THEME.DARK_FANTASY });

    expect(result).toEqual({
      status: ACTION_STATUS.SUCCESS,
      data: { theme: THEME.DARK_FANTASY },
      error: null,
    });
    expect(setCookie).toHaveBeenCalledWith(
      THEME_COOKIE_NAME,
      THEME.DARK_FANTASY,
      THEME_COOKIE_OPTIONS,
    );
    expect(update).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('updates the session User under the collection’s access control once the response is out, then refreshes the tags', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);

    await setTheme({ theme: THEME.DARK_FANTASY });
    await flushAfter();

    expect(update).toHaveBeenCalledWith({
      collection: 'users',
      id: user.id,
      data: { theme: THEME.DARK_FANTASY },
      overrideAccess: false,
      user,
    });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      [recordTag('users', user.id), 'max'],
      [collectionTag('users'), 'max'],
    ]);
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps the cookie and the success when the profile write is refused, and logs it', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);
    update.mockRejectedValue(new ActionError(ACTION_ERROR.FORBIDDEN));

    const result = await setTheme({ theme: THEME.DARK_FANTASY });
    await flushAfter();

    expect(result.status).toBe(ACTION_STATUS.SUCCESS);
    expect(setCookie).toHaveBeenCalledTimes(1);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.setTheme' }),
      'Profile Theme not saved',
    );
  });
});
