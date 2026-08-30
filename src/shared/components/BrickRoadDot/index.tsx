'use client';

import { Link } from '@/i18n/navigation';
import { StatusDot } from '@/shared/components/StatusDot';
import type { BrickRoad } from '@/shared/hooks/useBrickRoad';
import { cn } from '@/shared/lib/cn';

interface BrickRoadDotProps {
  /** What is wrong below here, from `useBrickRoad`, or `null` when nothing is. */
  road: BrickRoad | null;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * "There is a problem below here." A marker over a collapsed branch of the
 * interface, always a link: a dot the User cannot follow to the problem is worse
 * than no dot at all. Its name comes from `StatusDot`, so it is spoken once.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function BrickRoadDot({ road, className }: BrickRoadDotProps) {
  if (!road) {
    return null;
  }

  return (
    <Link className={cn('inline-flex', className)} href={road.targetHref}>
      <StatusDot status={road.status} />
    </Link>
  );
}

export type { BrickRoadDotProps };
export { BrickRoadDot };
