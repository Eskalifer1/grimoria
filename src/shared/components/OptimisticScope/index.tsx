'use client';

import { useState } from 'react';

import { OPTIMISTIC_SCOPE_COOKIE_NAME } from '@/constants/optimistic';
import { useOptimisticScope } from '@/shared/hooks/useOptimisticScope';
import { readCookie } from '@/shared/lib/cookie';

/** `null` on the server, where the prerendered HTML belongs to nobody in particular. */
function readScopeCookie(): string | null {
  return typeof document === 'undefined'
    ? null
    : readCookie(document.cookie, OPTIMISTIC_SCOPE_COOKIE_NAME);
}

/**
 * Tells the store whose overlay it is holding, and renders nothing — the answer
 * to "a Server Component cannot call a hook". The localized layout mounts it
 * once, and it takes no props: a session read there would opt every page out of
 * static rendering, so the User id travels in a cookie the client reads itself.
 *
 * **Place it before the surfaces that read the store.** Siblings render in order,
 * and after them the previous User's overlay is on screen for a frame.
 *
 * See docs/features/data-access/store.md.
 */
function OptimisticScope() {
  // A `useState` initializer, because the scope has to be set during the first
  // render and a cookie read is neither pure nor allowed to run twice.
  const [scope] = useState(readScopeCookie);

  useOptimisticScope(scope);

  return null;
}

export { OptimisticScope };
