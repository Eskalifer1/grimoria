import { NODE_ENVIRONMENT } from '@/constants/env.public';
import { OPTIMISTIC_SCOPE_COOKIE_NAME } from '@/constants/optimistic';
import { THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME } from '@/constants/theme';
import { toTheme } from '@/i18n/theme';

/** Better Auth's own sign-out endpoint — the only one that drops *this* device's session. */
const SIGN_OUT_PATH = '/sign-out';

/** What a Better Auth request may have settled, as much of it as the cookies need. */
interface SessionOutcome {
  /** The session the response is about to hand out, or `null` when it hands out none. */
  newSession: {
    /** `theme` is ours through `collectionOverrides`; Better Auth knows nothing about it. */
    user: { id: string; theme?: unknown };
    session: { expiresAt: Date };
  } | null;

  /** The Better Auth path, which is the only signal that a session was destroyed. */
  path: string;
}

/** One `Set-Cookie`, in the shape Better Auth's `ctx.setCookie` takes. */
interface SessionCookie {
  /** The cookie name, one of the two `constants/` values. */
  name: string;

  /** An empty string is how a cookie is cleared, paired with `maxAge: 0`. */
  value: string;

  options: {
    /** `/`, so one write covers every route rather than the endpoint's own path. */
    path: string;

    /** `lax` — sent on a top-level navigation, which is how the proxy sees it. */
    sameSite: 'lax';

    /** Both are read by the browser — the scope during the first render, the Theme by #78. */
    httpOnly: false;

    /** HTTPS-only in production; local development has no certificate. */
    secure: boolean;

    /** Lifetime in seconds, for the Theme and for clearing. */
    maxAge?: number;

    /** An absolute moment, for the scope: the session's own expiry. */
    expires?: Date;
  };
}

const SHARED_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  httpOnly: false,
  secure: NODE_ENVIRONMENT === 'production',
} as const satisfies SessionCookie['options'];

/**
 * The Theme stored on the profile, narrowed. A row that predates the field, or
 * one holding a Theme that no longer exists, reads as the default.
 */
function storedTheme(user: SessionOutcome['newSession']): string | undefined {
  const stored = user?.user.theme;

  return typeof stored === 'string' ? stored : undefined;
}

/**
 * The cookies a Better Auth response owes, given what it settled. Empty for a
 * request that neither minted nor destroyed a session.
 *
 * A new session writes both: the Theme, so the proxy can render a User's choice
 * without a database call, and the scope, so `OptimisticScope` knows whose
 * overlay it holds. Sign-out clears only the scope — the Theme is a device
 * preference, and it also words the sign-out screen.
 */
function sessionCookiesFor({ newSession, path }: SessionOutcome): SessionCookie[] {
  if (newSession) {
    return [
      {
        name: THEME_COOKIE_NAME,
        value: toTheme(storedTheme(newSession)),
        options: { ...SHARED_OPTIONS, maxAge: THEME_COOKIE_MAX_AGE },
      },
      {
        name: OPTIMISTIC_SCOPE_COOKIE_NAME,
        value: newSession.user.id,
        options: { ...SHARED_OPTIONS, expires: newSession.session.expiresAt },
      },
    ];
  }

  if (path === SIGN_OUT_PATH) {
    return [
      {
        name: OPTIMISTIC_SCOPE_COOKIE_NAME,
        value: '',
        options: { ...SHARED_OPTIONS, maxAge: 0 },
      },
    ];
  }

  return [];
}

export type { SessionCookie, SessionOutcome };
export { SIGN_OUT_PATH, sessionCookiesFor };
