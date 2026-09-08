import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, buildSecurityHeaders } from '@/constants/securityHeaders';

function headerValue(headers: ReturnType<typeof buildSecurityHeaders>, key: string): string {
  return headers.find((header) => header.key === key)?.value ?? '';
}

function directive(policy: string, name: string): string {
  return policy.split('; ').find((part) => part.startsWith(`${name} `)) ?? '';
}

describe('the app policy', () => {
  it('denies framing, plugins, a rewritten base and a cross-origin form target', () => {
    const policy = buildContentSecurityPolicy({ scope: 'app' });

    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
  });

  it('allows no script host beyond our own, and no eval outside development', () => {
    const scriptSource = directive(buildContentSecurityPolicy({ scope: 'app' }), 'script-src');

    expect(scriptSource).toBe("script-src 'self' 'unsafe-inline'");
  });

  it('adds the eval and websocket allowances the dev server needs, and only there', () => {
    const development = buildContentSecurityPolicy({ scope: 'app', environment: 'development' });
    const production = buildContentSecurityPolicy({ scope: 'app', environment: 'production' });

    expect(directive(development, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(development, 'connect-src')).toContain('ws:');
    expect(directive(production, 'script-src')).not.toContain("'unsafe-eval'");
    expect(directive(production, 'connect-src')).not.toContain('ws:');
  });

  it('upgrades insecure requests in production only, so a LAN dev build still loads', () => {
    expect(buildContentSecurityPolicy({ scope: 'app', environment: 'production' })).toContain(
      'upgrade-insecure-requests',
    );
    expect(buildContentSecurityPolicy({ scope: 'app', environment: 'development' })).not.toContain(
      'upgrade-insecure-requests',
    );
  });
});

describe('the admin policy', () => {
  it('adds what Payload needs to run, in production too', () => {
    const policy = buildContentSecurityPolicy({ scope: 'admin', environment: 'production' });

    expect(directive(policy, 'script-src')).toContain("'unsafe-eval'");
    expect(policy).toContain("worker-src 'self' blob:");
  });

  it('keeps framing denied, which is what the admin is worth framing for', () => {
    expect(buildContentSecurityPolicy({ scope: 'admin' })).toContain("frame-ancestors 'none'");
  });
});

describe('the header set', () => {
  it('denies framing, sniffing and the three device permissions on both scopes', () => {
    for (const scope of ['app', 'admin'] as const) {
      const headers = buildSecurityHeaders({ scope });

      expect(headerValue(headers, 'X-Frame-Options')).toBe('DENY');
      expect(headerValue(headers, 'X-Content-Type-Options')).toBe('nosniff');
      expect(headerValue(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(headerValue(headers, 'Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=()',
      );
      expect(headerValue(headers, 'Content-Security-Policy')).not.toBe('');
    }
  });

  it('sends HSTS in production only, without preload', () => {
    const production = buildSecurityHeaders({ scope: 'app', environment: 'production' });
    const development = buildSecurityHeaders({ scope: 'app', environment: 'development' });

    expect(headerValue(production, 'Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(headerValue(development, 'Strict-Transport-Security')).toBe('');
  });
});
