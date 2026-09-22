import { PENDING_ACTION } from '@/constants/optimistic';
import { THEME_OPTIMISTIC_KEY, type Theme } from '@/constants/theme';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

import { setTheme } from './index';

/**
 * Keyed by the device, not by a record: a Guest has no record, and the cookie —
 * not the profile — is what renders, so a User and a Guest overlay the same
 * entry. No version: the answer dates nothing, since the profile write lands
 * after it.
 */
const setThemeOptimistic = optimisticDescriptor<{ theme: Theme }, { theme: Theme }>({
  run: setTheme,
  pending: PENDING_ACTION.UPDATE,
  key: () => THEME_OPTIMISTIC_KEY,
  value: (data) => ({ theme: data.theme }),
});

export { setThemeOptimistic };
