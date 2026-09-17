import type { ReactElement } from 'react';
import { Suspense } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { getCurrentUser } from '@/api/user/getCurrentUser';
import { recordTag } from '@/constants/cacheTags';
import { OptimisticText } from '@/shared/components/OptimisticText';
import { ProfilePage, ProfileSection, ProfileStatus } from '@/views/ProfilePage';

vi.mock('@/api/user/getCurrentUser', () => ({ getCurrentUser: vi.fn() }));

const UNAUTHORIZED = new Error('UNAUTHORIZED_SENTINEL');

vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => {
    throw UNAUTHORIZED;
  }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));
// Keeps `next/root-params` (Next's compiler-only module, only real inside
// Next's own build) out of the graph — `Page` pulls it in through `Rule`.
vi.mock('@/i18n/resolveTheme', () => ({ resolveTheme: vi.fn().mockResolvedValue('standard') }));

const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Merlin',
  email: 'merlin@example.com',
  updatedAt: '2026-08-25T10:00:00.000Z',
};

/** The element a `children` prop holds, when there is exactly one. */
function onlyChild(element: ReactElement): ReactElement {
  return (element.props as { children: ReactElement }).children;
}

describe('ProfilePage', () => {
  it('renders a prerendered shell holding one Suspense hole', async () => {
    const page = await ProfilePage();
    const hole = onlyChild(page);

    expect(hole.type).toBe(Suspense);
    expect(onlyChild(hole).type).toBe(ProfileSection);
  });

  it('keeps the status line in the masthead, as a hole of its own', async () => {
    const page = await ProfilePage();
    const status = (page.props as { status: ReactElement }).status;

    expect(status.type).toBe(Suspense);
    expect(onlyChild(status).type).toBe(ProfileStatus);
  });
});

describe('ProfileStatus', () => {
  it('draws the name through the store for a signed-in User', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER);

    const status = await ProfileStatus();

    expect(status?.type).toBe(OptimisticText);
    expect(status?.props).toEqual({
      storeKey: recordTag('users', USER.id),
      field: 'name',
      value: USER.name,
      version: USER.updatedAt,
    });
  });

  it('is nothing for a Guest', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    expect(await ProfileStatus()).toBeNull();
  });
});

describe('ProfileSection', () => {
  it('renders the name form for a signed-in User', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER);

    const section = await ProfileSection();
    const form = onlyChild(section);

    expect(form.props).toMatchObject({ id: USER.id, name: USER.name, updatedAt: USER.updatedAt });
  });

  it('sends a Guest to the 401 boundary instead of the form', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(ProfileSection()).rejects.toThrow(UNAUTHORIZED);
  });
});
