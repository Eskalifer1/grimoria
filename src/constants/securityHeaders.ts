/**
 * The security response header set, built for `next.config.ts`'s `headers()`.
 * It reads the build's environment from `env.public.ts` rather than `env.ts`:
 * it loads at Next's config time, which cannot pay for the boot parse.
 * `docs/features/security-headers.md` is the reference.
 */

import { NODE_ENVIRONMENT } from './env.public';

/** `'admin'` is `/cms` and `/api`, which Payload owns; `'app'` is everything else. */
type SecurityScope = 'app' | 'admin';

type SecurityEnvironment = typeof NODE_ENVIRONMENT;

interface SecurityHeader {
  key: string;
  value: string;
}

interface SecurityHeadersOptions {
  scope: SecurityScope;
  /** Defaults to `NODE_ENV`; a test names it instead. */
  environment?: SecurityEnvironment;
}

// Two years. `preload` is deliberately absent — submitting the domain to the
// browsers' preload list is a post-launch decision, and it cannot be undone fast.
const HSTS_MAX_AGE_SECONDS = 63_072_000;

// `script-src` and `style-src` both keep `'unsafe-inline'`: Next writes the
// hydration payload into inline `<script>` tags and the Theme layer emits inline
// style attributes. A nonce would cover the scripts, but only on a page rendered
// per request — it costs static rendering and ISR outright, which is the trade
// this app declined (`docs/features/security-headers.md`).
const SHARED_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

/** The dev server's HMR talks over a websocket the production policy has no reason to allow. */
function connectSource(environment: SecurityEnvironment): string {
  return environment === 'development' ? "connect-src 'self' ws:" : "connect-src 'self'";
}

// Production only: browsers exempt `localhost` from the upgrade but not a LAN
// address, and a dev build reached over one has no TLS to be upgraded to.
function upgradeDirectives(environment: SecurityEnvironment): string[] {
  return environment === 'production' ? ['upgrade-insecure-requests'] : [];
}

// Payload's admin evaluates its field configuration and loads workers from a
// blob, neither of which the app itself does.
function scriptDirectives(scope: SecurityScope, environment: SecurityEnvironment): string[] {
  const needsEval = scope === 'admin' || environment === 'development';

  return [
    `script-src 'self' 'unsafe-inline'${needsEval ? " 'unsafe-eval'" : ''}`,
    ...(scope === 'admin' ? ["worker-src 'self' blob:"] : []),
  ];
}

/**
 * The policy for one scope. Both deny framing, plugins, a rewritten `<base>` and
 * a cross-origin form target; they differ only in what Payload's admin needs on
 * top to run at all.
 */
function buildContentSecurityPolicy({
  scope,
  environment = NODE_ENVIRONMENT,
}: SecurityHeadersOptions): string {
  return [
    ...scriptDirectives(scope, environment),
    connectSource(environment),
    ...SHARED_DIRECTIVES,
    ...upgradeDirectives(environment),
  ].join('; ');
}

/** Every security header one scope's responses carry. */
function buildSecurityHeaders({
  scope,
  environment = NODE_ENVIRONMENT,
}: SecurityHeadersOptions): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy({ scope, environment }) },
  ];

  if (environment === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains`,
    });
  }

  return headers;
}

export type { SecurityHeader, SecurityScope };
export { buildContentSecurityPolicy, buildSecurityHeaders };
