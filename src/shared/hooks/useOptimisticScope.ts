'use client';

import { useEffect, useRef } from 'react';

import { useOptimisticStore } from '@/shared/hooks/useOptimisticStore';

/**
 * Names whose overlay the store is holding — a User id, or `null` for nobody
 * signed in. One `localStorage` slot serves the whole browser, so without this a
 * failure one User walked away from renders to the next one on the same machine.
 *
 * Call it **above** every optimistic surface on the screen. A surface that mounts
 * without it reads an empty store and writes under no scope, which is safe but
 * loses the overlay across a reload.
 *
 * See docs/features/data-access/store.md.
 */
function useOptimisticScope(scope: string | null): void {
  const store = useOptimisticStore();
  const applied = useRef<string | null | undefined>(undefined);

  // During the render rather than in an effect: a surface below reads the store on
  // its own first render and an effect runs after that, so an effect would put the
  // previous User's overlay on screen for a frame — the one frame this exists to
  // prevent. On that render nothing has subscribed yet, so nothing is being
  // updated mid-render either.
  if (applied.current === undefined) {
    applied.current = scope;
    store.setScope(scope);
  }

  // A scope that changes while the tree is mounted — a sign-out that does not
  // navigate — is the effect's, because by then a render is committed and the
  // surfaces below are listening.
  useEffect(() => {
    if (applied.current !== scope) {
      applied.current = scope;
      store.setScope(scope);
    }
  }, [store, scope]);
}

export { useOptimisticScope };
