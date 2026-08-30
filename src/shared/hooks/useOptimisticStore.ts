'use client';

import { createContext, useContext } from 'react';

import { type OptimisticStore, optimisticStore } from '@/shared/lib/optimistic/store';

/**
 * The store every optimistic hook reads and writes, defaulted to the app's
 * singleton so nothing has to provide it.
 *
 * The context exists for the same reason `createOptimisticStore` is a factory:
 * `runOptimistic` already takes its store as an argument, and without this the
 * layer above it would be the one place that could only ever address the global
 * one — a test rendering a tree would be sharing state with every other case in
 * the run, and remembering to wipe it would be the only thing keeping them apart.
 */
const OptimisticStoreContext = createContext<OptimisticStore>(optimisticStore);

/** The store this part of the tree writes through. The singleton unless a provider says otherwise. */
function useOptimisticStore(): OptimisticStore {
  return useContext(OptimisticStoreContext);
}

export { OptimisticStoreContext, useOptimisticStore };
