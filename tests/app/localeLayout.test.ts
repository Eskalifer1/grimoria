import { describe, expect, it, vi } from 'vitest';

import { generateMetadata, generateViewport } from '@/app/(frontend)/[theme]/[locale]/layout';
import { resolveTheme } from '@/i18n/resolveTheme';

// `next/root-params` is only real inside Next's own build, so both readers are
// stood in for — the layout reads nothing else.
vi.mock('@/i18n/resolveTheme', () => ({ resolveTheme: vi.fn().mockResolvedValue('standard') }));
vi.mock('@/i18n/resolveLocale', () => ({ resolveLocale: vi.fn().mockResolvedValue('en') }));
vi.mock('@/i18n/metaMessages', () => ({
  getMetaMessages: vi.fn().mockResolvedValue({ pages: {}, site: { description: 'Site pitch.' } }),
}));

describe('the root generateMetadata', () => {
  it('templates every page title under the brand', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({ default: 'Grimoria', template: '%s | Grimoria' });
    expect(metadata.description).toBe('Site pitch.');
  });

  it('carries the site-wide Open Graph and Twitter defaults', async () => {
    const metadata = await generateMetadata();

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Grimoria',
      locale: 'en_US',
      title: 'Grimoria',
      description: 'Site pitch.',
    });
    expect(metadata.twitter).toEqual({ card: 'summary_large_image' });
  });
});

describe('the root generateViewport', () => {
  it('sets one theme-color per Theme, with no color-scheme media query', async () => {
    vi.mocked(resolveTheme).mockResolvedValueOnce('standard');
    const standard = await generateViewport();

    vi.mocked(resolveTheme).mockResolvedValueOnce('dark-fantasy');
    const darkFantasy = await generateViewport();

    expect(typeof standard.themeColor).toBe('string');
    expect(typeof darkFantasy.themeColor).toBe('string');
    expect(standard.themeColor).not.toBe(darkFantasy.themeColor);
    expect(standard.viewportFit).toBe('cover');
  });
});
