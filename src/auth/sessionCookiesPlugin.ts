import { createAuthMiddleware } from 'better-auth/api';
import type { BetterAuthPlugin } from 'better-auth/types';

import { sessionCookiesFor } from './sessionCookies';

/**
 * Mirrors a session into the two cookies the app renders from — the Theme the
 * proxy reads for everyone, and the scope `OptimisticScope` reads on the client.
 *
 * It matches every endpoint and lets `sessionCookiesFor` decide, so a sign-in
 * method added later (OAuth #1, impersonation #11) is covered by construction
 * rather than by remembering to extend a list of paths.
 */
function sessionCookiesPlugin(): BetterAuthPlugin {
  return {
    id: 'grimoria-session-cookies',
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            const written = sessionCookiesFor({
              newSession: ctx.context.newSession,
              path: ctx.path,
            });

            for (const cookie of written) {
              ctx.setCookie(cookie.name, cookie.value, cookie.options);
            }
          }),
        },
      ],
    },
  };
}

export { sessionCookiesPlugin };
