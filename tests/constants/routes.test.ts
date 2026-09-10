import { describe, expect, it } from 'vitest';

import { FRONTEND_ROUTES, ROUTE_PATTERNS } from '@/constants/routes';

describe('ROUTE_PATTERNS', () => {
  it('wraps a route in the hidden segments Next matches on', () => {
    expect(ROUTE_PATTERNS.PROFILE).toBe('/[theme]/[locale]/profile');
  });

  it('leaves the home route no trailing slash to match nothing with', () => {
    expect(ROUTE_PATTERNS.HOME).toBe('/[theme]/[locale]');
  });

  it('holds one entry per frontend route, so a write can never name a missing one', () => {
    expect(Object.keys(ROUTE_PATTERNS).sort()).toEqual(Object.keys(FRONTEND_ROUTES).sort());
  });
});
