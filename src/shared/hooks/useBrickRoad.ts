'use client';

import { ACTION_STATUS, type ActionStatus } from '@/constants/action';
import type { OptimisticErrorCode } from '@/constants/optimistic';
import { useOptimisticSnapshot } from '@/shared/hooks/useOptimisticEntry';
import { entryError } from '@/shared/lib/optimistic/read';

/** A key worth warning about, and where the User goes to deal with it. */
interface BrickRoadTarget {
  key: string;

  /** A route from `ROUTES`, resolving to the surface the failure is on. */
  href: string;
}

/** "There is a problem below here, this is what it is, and this is where it lives." */
interface BrickRoad {
  /** Always `FAILURE` today — flight is not a problem — and typed as the full set so a marker can grow. */
  status: ActionStatus;

  /** The code the marker words itself from, an action's or the store's own. */
  reason: OptimisticErrorCode;

  /** Never optional: a marker the User cannot follow to the problem is worse than no marker. */
  targetHref: string;
}

/**
 * Answers whether anything under a branch of the interface has failed, so a
 * marker can be drawn where the branch is collapsed. Flight is not a problem —
 * a write in progress is the normal case and warning about it is noise.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
function useBrickRoad(targets: readonly BrickRoadTarget[]): BrickRoad | null {
  const entries = useOptimisticSnapshot();

  for (const target of targets) {
    const error = entryError(entries[target.key] ?? null);

    if (error) {
      return { status: ACTION_STATUS.FAILURE, reason: error.code, targetHref: target.href };
    }
  }

  return null;
}

export type { BrickRoad, BrickRoadTarget };
export { useBrickRoad };
