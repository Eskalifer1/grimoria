import { describe, expect, it, vi } from 'vitest';

import { pageMetadata } from '@/i18n/pageMetadata';

vi.mock('@/i18n/metaMessages', () => ({
  getMetaMessages: vi.fn().mockResolvedValue({
    pages: {
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
    const metadata = await pageMetadata('profilePage')(ROUTE_PROPS, PARENT);

    expect(metadata.title).toBe('My profile');
    expect(metadata.description).toBe('Your name, as the rest of Grimoria sees it.');
  });

  it('mirrors both into openGraph, which Next replaces wholesale per segment', async () => {
    const metadata = await pageMetadata('profilePage')(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      title: 'My profile',
      description: 'Your name, as the rest of Grimoria sees it.',
    });
  });

  it("keeps the root segment's site name, locale, type and image under the mirrored fields", async () => {
    const metadata = await pageMetadata('profilePage')(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Grimoria',
      locale: 'en_US',
      images: PARENT_OPEN_GRAPH.images,
    });
  });

  it('lets an override win over a mirrored field and adds what it brings', async () => {
    const metadata = await pageMetadata('profilePage', {
      openGraph: { type: 'article', title: 'Elsewhere' },
    })(ROUTE_PROPS, PARENT);

    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      title: 'Elsewhere',
      description: 'Your name, as the rest of Grimoria sees it.',
    });
    expect(metadata.title).toBe('My profile');
  });
});
