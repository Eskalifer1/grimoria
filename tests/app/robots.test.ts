import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/constants/env.server');
});

describe('robots', () => {
  it('allows the site and names the sitemap in production', async () => {
    vi.doMock('@/constants/env.server', () => ({
      IS_PRODUCTION_DEPLOYMENT: true,
      METADATA_BASE_URL: 'https://grimoria.example',
    }));
    const { default: robots } = await import('@/app/robots');

    expect(robots().rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/cms', '/api'],
    });
    expect(robots().sitemap).toBe('https://grimoria.example/sitemap.xml');
  });

  it('disallows everything outside production', async () => {
    vi.doMock('@/constants/env.server', () => ({
      IS_PRODUCTION_DEPLOYMENT: false,
      METADATA_BASE_URL: 'https://grimoria.example',
    }));
    const { default: robots } = await import('@/app/robots');

    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(robots().sitemap).toBeUndefined();
  });
});
