import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except the paths that must never be locale-rewritten: Payload's
  // built-in admin at `/cms` and its REST/GraphQL API under `/api`, Next's
  // internals, and any request for a real file.
  matcher: ['/((?!cms|api|_next|_vercel|.*\\..*).*)'],
};
