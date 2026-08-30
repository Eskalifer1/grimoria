'use client';

import { useOptimisticScope } from '@/shared/hooks/useOptimisticScope';

interface OptimisticScopeProps {
  /** Whose overlay the store may hold — a User id, or `null` for nobody signed in. */
  scope: string | null;
}

/**
 * Tells the store whose overlay it is holding, and renders nothing — the answer
 * to "a Server Component cannot call a hook". The locale layout mounts it once.
 *
 * **Place it before the surfaces that read the store.** Siblings render in order,
 * and after them the previous User's overlay is on screen for a frame.
 *
 * See docs/features/data-access/store.md.
 */
function OptimisticScope({ scope }: OptimisticScopeProps) {
  useOptimisticScope(scope);

  return null;
}

export type { OptimisticScopeProps };
export { OptimisticScope };
