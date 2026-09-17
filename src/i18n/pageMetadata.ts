import type { Metadata, ResolvingMetadata } from 'next';

import { getMetaMessages, type MetaMessages } from './metaMessages';

/** A page entry in `meta.json`: adding one there is what admits it here. */
type MetadataNamespace = keyof MetaMessages['pages'];

/**
 * What a page may add over the mirrored fields. `title` and `description` are
 * not on it: an override there would leave `og:title` on the catalog's value.
 */
type MetadataOverrides = Omit<Metadata, 'title' | 'description'>;

/** The function a page exports as `generateMetadata`. */
type GenerateMetadata = (
  props: { params: Promise<Record<string, string>> },
  parent: ResolvingMetadata,
) => Promise<Metadata>;

/**
 * A page's whole metadata in one call:
 * `export const generateMetadata = pageMetadata('profilePage')`.
 *
 * Reads the page's `title` and `description` from `meta.json` and mirrors both
 * into `openGraph`, because Next replaces a segment's `openGraph` wholesale
 * rather than filling `og:title` from `title`. For the same reason the root's
 * resolved `openGraph` — site name, locale, type, the image beside the layout —
 * is carried under the mirrored fields.
 *
 * @param overrides `Metadata` merged over the mirrored fields — an image,
 * `openGraph.type: 'article'`, `publishedTime` — for a page that has more to
 * say. Not `title` or `description`: those come from the catalog only.
 */
function pageMetadata(
  namespace: MetadataNamespace,
  overrides: MetadataOverrides = {},
): GenerateMetadata {
  return async (_props, parent) => {
    const [{ pages }, { openGraph }] = await Promise.all([getMetaMessages(), parent]);
    const { title, description } = pages[namespace];

    return {
      title,
      description,
      ...overrides,
      openGraph: { ...openGraph, title, description, ...overrides.openGraph },
    };
  };
}

export type { MetadataNamespace };
export { pageMetadata };
