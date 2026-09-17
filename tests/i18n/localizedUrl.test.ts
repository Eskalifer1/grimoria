import { describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { localizedUrl } from '@/i18n/localizedUrl';
import { routing } from '@/i18n/routing';

vi.mock('@/constants/env.server', () => ({ METADATA_BASE_URL: 'https://grimoria.example' }));

describe('localizedUrl', () => {
  it('serves the default locale bare, with a trailing slash on home alone', () => {
    expect(localizedUrl(ROUTES.HOME, routing.defaultLocale)).toBe('https://grimoria.example/');
    expect(localizedUrl(ROUTES.PROFILE, routing.defaultLocale)).toBe(
      'https://grimoria.example/profile',
    );
  });

  it('prefixes every other locale', () => {
    expect(localizedUrl(ROUTES.PROFILE, 'uk')).toBe('https://grimoria.example/uk/profile');
  });
});
