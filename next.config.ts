import type { NextConfig } from 'next';

import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';

import { buildSecurityHeaders } from './src/constants/securityHeaders';

const nextConfig: NextConfig = {
  // Memoizes components and hooks at build time, so a value or callback is not
  // rebuilt unless what it is made of changed. Stable by default in Next 16; off
  // by default only because it runs through Babel and costs build time.
  reactCompiler: true,

  experimental: {
    // TypeScript 7 ships no Compiler API, which is what Next normally calls to
    // type-check a build. This makes it shell out to the `tsc` binary instead.
    // Without it `next build` fails outright (ADR-0008). Next 16.3 makes this
    // the default, so it can be deleted on that upgrade — see #77.
    useTypeScriptCli: true,
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
