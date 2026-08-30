'use client';

import { useSyncExternalStore } from 'react';

/** The browser's own answer, which is signage only — a write still goes out and still fails. */
function subscribe(onChange: () => void): () => void {
  const listening = new AbortController();

  window.addEventListener('offline', onChange, { signal: listening.signal });
  window.addEventListener('online', onChange, { signal: listening.signal });

  return () => listening.abort();
}

function getSnapshot(): boolean {
  return !navigator.onLine;
}

/**
 * Whether the browser believes the connection is gone. The server renders as
 * online: it cannot know, and hydrating into a warning nobody earned is worse
 * than one frame late.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export { useIsOffline };
