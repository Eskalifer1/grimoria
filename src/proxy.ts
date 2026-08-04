import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except the paths that must never be locale-rewritten: the gated
  // `/admin` route group (ADR-0001), Payload's REST/GraphQL API and its
  // built-in admin, Next's internals, and any request for a real file.
  matcher: ['/((?!admin|api|_next|_vercel|.*\\..*).*)'],
};
