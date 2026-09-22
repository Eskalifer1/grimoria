import { describe, expect, it } from 'vitest';

import { setThemeOptimistic } from '@/api/user/setTheme/optimistic';
import { PENDING_ACTION } from '@/constants/optimistic';
import { THEME, THEME_OPTIMISTIC_KEY } from '@/constants/theme';

describe('setThemeOptimistic', () => {
  it('addresses one device-level key, so a Guest and a User overlay the same entry', () => {
    expect(setThemeOptimistic.key({ theme: THEME.DARK_FANTASY })).toBe(THEME_OPTIMISTIC_KEY);
  });

  it('is an update, so a failure leaves the toggle at full opacity', () => {
    expect(setThemeOptimistic.pending).toBe(PENDING_ACTION.UPDATE);
  });

  it('patches the theme alone and carries no version', () => {
    expect(setThemeOptimistic.value?.({ theme: THEME.DARK_FANTASY })).toEqual({
      theme: THEME.DARK_FANTASY,
    });
    expect(setThemeOptimistic.version).toBeUndefined();
  });
});
