import type { MetadataRoute } from 'next';

import { IS_PRODUCTION_DEPLOYMENT, METADATA_BASE_URL } from '@/constants/env.server';
import { ROUTES } from '@/constants/routes';

/**
 * Private pages stay off this list: a crawler cannot read a page's own `noindex` when
 * robots.txt already blocks the URL, and robots.txt itself is public. Reads only
 * constants, so Next renders it static.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_DEPLOYMENT) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/', disallow: [ROUTES.ADMIN, ROUTES.API] },
    sitemap: new URL('/sitemap.xml', METADATA_BASE_URL).href,
  };
}
