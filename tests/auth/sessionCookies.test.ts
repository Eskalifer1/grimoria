import { describe, expect, it } from 'vitest';

import { SIGN_OUT_PATH, sessionCookiesFor } from '@/auth/sessionCookies';
import { OPTIMISTIC_SCOPE_COOKIE_NAME } from '@/constants/optimistic';
import { THEME_COOKIE_NAME } from '@/constants/theme';

const EXPIRES_AT = new Date('2026-10-01T00:00:00.000Z');

const NEW_SESSION = {
  user: { id: 'user-1', theme: 'dark-fantasy' },
  session: { expiresAt: EXPIRES_AT },
};

function byName(written: ReturnType<typeof sessionCookiesFor>, name: string) {
  return written.find((cookie) => cookie.name === name);
}

describe('sessionCookiesFor', () => {
  it('writes both cookies for a new session, whichever endpoint minted it', () => {
    const written = sessionCookiesFor({ newSession: NEW_SESSION, path: '/sign-in/email' });

    expect(byName(written, THEME_COOKIE_NAME)?.value).toBe('dark-fantasy');
    expect(byName(written, OPTIMISTIC_SCOPE_COOKIE_NAME)?.value).toBe('user-1');
  });

  it('gives the scope the session own expiry and the Theme a life of its own', () => {
    const written = sessionCookiesFor({ newSession: NEW_SESSION, path: '/sign-up/email' });

    expect(byName(written, OPTIMISTIC_SCOPE_COOKIE_NAME)?.options.expires).toEqual(EXPIRES_AT);
    expect(byName(written, THEME_COOKIE_NAME)?.options.maxAge).toBeGreaterThan(0);
  });

  it('falls back to the default Theme when the profile holds nothing usable', () => {
    const written = sessionCookiesFor({
      newSession: { ...NEW_SESSION, user: { id: 'user-1', theme: null } },
      path: '/sign-in/email',
    });

    expect(byName(written, THEME_COOKIE_NAME)?.value).toBe('standard');
  });

  it('clears the scope on sign-out and leaves the Theme where it is', () => {
    const written = sessionCookiesFor({ newSession: null, path: SIGN_OUT_PATH });

    expect(byName(written, OPTIMISTIC_SCOPE_COOKIE_NAME)?.options.maxAge).toBe(0);
    expect(byName(written, THEME_COOKIE_NAME)).toBeUndefined();
  });

  it('writes nothing for a request that neither made nor ended a session', () => {
    expect(sessionCookiesFor({ newSession: null, path: '/get-session' })).toEqual([]);
  });

  it('keeps both cookies readable by the browser, which is what reads them', () => {
    const written = sessionCookiesFor({ newSession: NEW_SESSION, path: '/sign-in/email' });

    expect(written.every((cookie) => cookie.options.httpOnly === false)).toBe(true);
  });
});
