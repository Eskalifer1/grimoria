import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { THEME_COOKIE_NAME } from '@/constants/theme';
import proxy from '@/proxy';

const ORIGIN = 'https://grimoria.test';

function request(path: string, theme?: string): NextRequest {
  const built = new NextRequest(new URL(path, ORIGIN));

  if (theme) {
    built.cookies.set(THEME_COOKIE_NAME, theme);
  }

  return built;
}

/** Where the request actually lands, as the rewrite header carries it. */
function rewrittenPath(path: string, theme?: string): string | undefined {
  const rewrite = proxy(request(path, theme)).headers.get('x-middleware-rewrite');

  return rewrite ? new URL(rewrite).pathname : undefined;
}

/** The address the visitor is sent to, when the answer is a redirect. */
function redirect(path: string): { status: number; pathname: string } {
  const response = proxy(request(path));

  return {
    status: response.status,
    pathname: new URL(response.headers.get('location') ?? ORIGIN).pathname,
  };
}

describe('the proxy', () => {
  it('rewrites to the Theme the cookie names', () => {
    expect(rewrittenPath('/', 'dark-fantasy')).toBe('/dark-fantasy/en');
    expect(rewrittenPath('/profile', 'dark-fantasy')).toBe('/dark-fantasy/en/profile');
  });

  it('falls back to the default Theme for a Guest and for a cookie naming nothing', () => {
    expect(rewrittenPath('/')).toBe('/standard/en');
    expect(rewrittenPath('/', 'gothic')).toBe('/standard/en');
  });

  it('carries the query through the redirect, which is the half of the address the path is not', () => {
    const location = proxy(request('/standard/en/notes?tag=abc')).headers.get('location') ?? '';

    expect(location).toContain('/notes?tag=abc');
  });

  // Every arrangement of the two hidden segments a visitor can type, since each
  // is stripped by different code: the Theme here, the default locale by next-intl.
  describe('sends every address holding a hidden segment to the clean one', () => {
    it.each([
      ['a Theme and a locale and a path', '/dark-fantasy/en/profile', '/profile'],
      ['a Theme and a locale', '/dark-fantasy/en', '/'],
      ['a Theme and a path', '/standard/profile', '/profile'],
      ['a Theme alone', '/standard', '/'],
      ['a locale and a path', '/en/profile', '/profile'],
      ['a locale alone', '/en', '/'],
    ])('%s', (_case, typed, clean) => {
      const answer = redirect(typed);

      expect(answer.status).toBeGreaterThanOrEqual(300);
      expect(answer.status).toBeLessThan(400);
      expect(answer.pathname).toBe(clean);
    });
  });

  it('leaves an address holding neither segment alone, and renders it', () => {
    expect(proxy(request('/profile')).headers.has('location')).toBe(false);
    expect(rewrittenPath('/profile')).toBe('/standard/en/profile');
  });
});
