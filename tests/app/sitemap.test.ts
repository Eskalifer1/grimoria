import { describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';
import { PUBLIC_ROUTES, ROUTES } from '@/constants/routes';

vi.mock('@/constants/env.server', () => ({ METADATA_BASE_URL: 'https://grimoria.example' }));

describe('sitemap', () => {
  it('lists every public route as an absolute URL and nothing else', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual(
      Object.values(PUBLIC_ROUTES).map((route) => `https://grimoria.example${route}`),
    );
    expect(urls).not.toContain(`https://grimoria.example${ROUTES.PROFILE}`);
  });

  it('carries lastModified and an alternate per locale plus x-default on each entry', () => {
    for (const entry of sitemap()) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.alternates?.languages).toEqual({
        en: entry.url,
        'x-default': entry.url,
      });
    }
  });
});
