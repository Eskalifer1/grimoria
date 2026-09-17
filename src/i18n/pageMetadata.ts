import type { Metadata, ResolvingMetadata } from 'next';

import { FRONTEND_ROUTES, ROUTE_AUDIENCE, ROUTE_AUDIENCES } from '@/constants/routes';
import { localizedUrl } from '@/i18n/localizedUrl';
import { routing } from '@/i18n/routing';

import { getMetaMessages, type MetaMessages } from './metaMessages';

/** A page entry in `meta.json`: adding one there is what admits it here. */
type MetadataNamespace = keyof MetaMessages['pages'];

/** The route a page sits on, as its `FRONTEND_ROUTES` key — its audience decides indexing. */
type RouteKey = keyof typeof FRONTEND_ROUTES;

/**
 * What a page may add over the mirrored fields. `title` and `description` are
 * not on it: an override there would leave `og:title` on the catalog's value.
 * Nor `robots` and `alternates`: the route's audience decides those.
 */
type MetadataOverrides = Omit<Metadata, 'title' | 'description' | 'robots' | 'alternates'>;

/** The function a page exports as `generateMetadata`. */
type GenerateMetadata = (
  props: { params: Promise<Record<string, string>> },
  parent: ResolvingMetadata,
) => Promise<Metadata>;

/** The `robots`, canonical and `hreflang` a route's audience earns. */
function indexingMetadata(routeKey: RouteKey, locale: string): Metadata {
  if (ROUTE_AUDIENCES[routeKey] !== ROUTE_AUDIENCE.ANYONE) {
    return { robots: { index: false, follow: false } };
  }

  const route = FRONTEND_ROUTES[routeKey];
  const languages = Object.fromEntries(
    routing.locales.map((routeLocale) => [routeLocale, localizedUrl(route, routeLocale)]),
  );

  return {
    robots: { index: true, follow: true },
    alternates: {
      canonical: localizedUrl(route, locale),
      languages: { ...languages, 'x-default': localizedUrl(route, routing.defaultLocale) },
    },
  };
}

/**
 * A page's whole metadata in one call:
 * `export const generateMetadata = pageMetadata('profilePage', 'PROFILE')`.
 *
 * Reads the page's `title` and `description` from `meta.json` and mirrors both
 * into `openGraph`, because Next replaces a segment's `openGraph` wholesale
 * rather than filling `og:title` from `title`. For the same reason the root's
 * resolved `openGraph` — site name, locale, type, the image beside the layout —
 * is carried under the mirrored fields.
 *
 * The route key decides indexing: an `ANYONE` route is indexed, with a
 * self-referencing canonical and an `hreflang` per locale plus `x-default`; a
 * `GUEST` or `USER` route is `noindex, nofollow` with no alternates at all.
 *
 * @param overrides `Metadata` merged over the mirrored fields — an image,
 * `openGraph.type: 'article'`, `publishedTime` — for a page that has more to
 * say. Not `title` or `description`: those come from the catalog only.
 */
function pageMetadata(
  namespace: MetadataNamespace,
  routeKey: RouteKey,
  overrides: MetadataOverrides = {},
): GenerateMetadata {
  return async (props, parent) => {
    const [{ pages }, { openGraph }, { locale }] = await Promise.all([
      getMetaMessages(),
      parent,
      props.params,
    ]);
    const { title, description } = pages[namespace];

    return {
      title,
      description,
      ...indexingMetadata(routeKey, locale ?? routing.defaultLocale),
      ...overrides,
      openGraph: { ...openGraph, title, description, ...overrides.openGraph },
    };
  };
}

export type { MetadataNamespace };
export { pageMetadata };
