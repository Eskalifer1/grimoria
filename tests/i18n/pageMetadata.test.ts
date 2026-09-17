import { describe, expect, it, vi } from 'vitest';

import { THEMES } from '@/constants/theme';
import { pageMetadata } from '@/i18n/pageMetadata';

vi.mock('@/constants/env.server', () => ({ METADATA_BASE_URL: 'https://grimoria.example' }));

vi.mock('@/i18n/metaMessages', () => ({
  getMetaMessages: vi.fn().mockResolvedValue({
    pages: {
      homePage: {
        title: 'Grimoria',
        description: 'A personal knowledge base.',
      },
      profilePage: {
        title: 'My profile',
        description: 'Your name, as the rest of Grimoria sees it.',
      },
    },
    site: { description: 'Site pitch.' },
  }),
}));

const ROUTE_PROPS = { params: Promise.resolve({ theme: 'standard', locale: 'en' }) } as never;
const PARENT_OPEN_GRAPH = {
  type: 'website',
  siteName: 'Grimoria',
  locale: 'en_US',
  title: 'Grimoria',
  images: [{ url: 'https://grimoria.example/opengraph-image.jpg' }],
};
const PARENT = Promise.resolve({ openGraph: PARENT_OPEN_GRAPH }) as never;

describe('pageMetadata', () => {
  it('reads the page title and description from meta.json', async () => {
    const metadata = await pageMetadata('profilePage', 'PROFILE')(ROUTE_PROPS, PARENT);

    expect(metadata.title).toBe('My profile');
    expect(metadata.description).toBe('Your name, as the rest of Grimoria sees it.');
  });

  it('mirrors both into openGraph, which Next replaces wholesale per segment', async () => {
    const metadata = await pageMetadata('profilePage', 'PROFILE')(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      title: 'My profile',
      description: 'Your name, as the rest of Grimoria sees it.',
    });
  });

  it("keeps the root segment's site name, locale, type and image under the mirrored fields", async () => {
    const metadata = await pageMetadata('profilePage', 'PROFILE')(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Grimoria',
      locale: 'en_US',
      images: PARENT_OPEN_GRAPH.images,
    });
  });

  it('lets an override win over a mirrored field and adds what it brings', async () => {
    const metadata = await pageMetadata('profilePage', 'PROFILE', {
      openGraph: { type: 'article', title: 'Elsewhere' },
    })(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      title: 'Elsewhere',
      description: 'Your name, as the rest of Grimoria sees it.',
    });
    expect(metadata.title).toBe('My profile');
  });

  it('keeps a USER route out of the index, with no canonical and no hreflang', async () => {
    const metadata = await pageMetadata('profilePage', 'PROFILE')(ROUTE_PROPS, PARENT);

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
  });

  it('indexes an ANYONE route with a self-referencing canonical and an hreflang per locale', async () => {
    const metadata = await pageMetadata('homePage', 'HOME')(ROUTE_PROPS, PARENT);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe('https://grimoria.example/');
    expect(metadata.alternates?.languages).toEqual({
      en: 'https://grimoria.example/',
      'x-default': 'https://grimoria.example/',
    });
  });

  it('emits no URL carrying a Theme segment', async () => {
    const metadata = await pageMetadata('homePage', 'HOME')(ROUTE_PROPS, PARENT);
    const serialized = JSON.stringify(metadata.alternates);

    for (const theme of THEMES) {
      expect(serialized).not.toContain(`/${theme}/`);
    }
  });
});
