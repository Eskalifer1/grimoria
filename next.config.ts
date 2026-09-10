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
    // Lets `resolveTheme()` read the hidden `[theme]` segment instead of a
    // cookie, which is what keeps a page static. #95 implies it and drops this.
    rootParams: true,

    // TypeScript 7 ships no Compiler API, so `next build` fails outright without
    // this (ADR-0008); it shells out to `tsc` instead. Default in 16.3 — #77.
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
