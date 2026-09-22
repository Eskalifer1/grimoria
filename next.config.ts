import type { NextConfig } from 'next';

import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';

import { buildSecurityHeaders } from './src/constants/securityHeaders';

const nextConfig: NextConfig = {
  // Memoizes components and hooks at build time, so a value or callback is not
  // rebuilt unless what it is made of changed. Stable by default in Next 16; off
  // by default only because it runs through Babel and costs build time.
  reactCompiler: true,

  // Every page is a prerendered shell with Suspense holes; a read is cached by
  // directive and invalidated by tag (ADR-0018). Implies `experimental.rootParams`.
  cacheComponents: true,

  experimental: {
    // What mounts `unauthorized.tsx` and `forbidden.tsx` and gives `unauthorized()`
    // and `forbidden()` a boundary to render — without it both are dead files.
    authInterrupts: true,

    // Mounts `app/global-not-found.tsx` for a URL the proxy never rewrote —
    // without it such a URL gets Next's own unstyled 404.
    globalNotFound: true,
  },

  /**
   * `next dev` and `next build` both run Turbopack, so this is the only SVG
   * rule. svgo runs inside SVGR: ids are prefixed per file so two mascots on
   * one page never share one, classes are kept as written because the Theme
   * stylesheet colors by them, and same-class paths are never merged — a union
   * of two contours can punch a hole where they overlap.
   */
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: { mergePaths: false, convertPathData: { floatPrecision: 1 } },
                    },
                  },
                  { name: 'prefixIds', params: { prefixClassNames: false } },
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },

  // Next applies every matching rule and the last write of a key wins, so the
  // two Payload paths go last: they match `/:path*` as well, and their looser
  // policy has to survive the app's.
  headers() {
    return Promise.resolve([
      { source: '/:path*', headers: buildSecurityHeaders({ scope: 'app' }) },
      { source: '/cms/:path*', headers: buildSecurityHeaders({ scope: 'admin' }) },
      { source: '/api/:path*', headers: buildSecurityHeaders({ scope: 'admin' }) },
    ]);
  },
};

const withNextIntl = createNextIntlPlugin();

export default withPayload(withNextIntl(nextConfig));
