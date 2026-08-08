import type { NextConfig } from 'next';

import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    // TypeScript 7 ships no Compiler API, which is what Next normally calls to
    // type-check a build. This makes it shell out to the `tsc` binary instead.
    // Without it `next build` fails outright (ADR-0008). Next 16.3 makes this
    // the default, so it can be deleted on that upgrade — see #77.
    useTypeScriptCli: true,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withPayload(withNextIntl(nextConfig));
