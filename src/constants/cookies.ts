import { NODE_ENVIRONMENT } from '@/constants/env.public';

/**
 * How every cookie the browser is meant to read is written — the Theme and the
 * optimistic scope. `lax`, so a top-level navigation carries it to the proxy;
 * `httpOnly: false`, so the first client render can read it; `secure` only
 * where there is a certificate. Lifetime is each cookie's own.
 */
const BROWSER_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  httpOnly: false,
  secure: NODE_ENVIRONMENT === 'production',
} as const;

export { BROWSER_COOKIE_OPTIONS };
