'use client';

import dynamic from 'next/dynamic';
import type { ComponentType, SVGProps } from 'react';

import { MASCOT_POSE, type MascotPose } from '@/constants/mascot';
import { SilentBoundary } from '@/shared/components/SilentBoundary';
import { cn } from '@/shared/lib/cn';

/**
 * One chunk per pose, fetched when it first mounts and never for the others; a
 * static import in `error.tsx` would land the drawing in the chunk Next
 * preloads on every page. `loading` is what makes App Router `dynamic` wrap the
 * chunk in its own Suspense — without it the whole surface suspends.
 */
function pose(load: () => Promise<{ default: ComponentType<SVGProps<SVGSVGElement>> }>) {
  return dynamic(load, { loading: () => null });
}

const POSE = {
  [MASCOT_POSE.SAD]: pose(() => import('@/shared/assets/mascot/sad.svg')),
  [MASCOT_POSE.LOST]: pose(() => import('@/shared/assets/mascot/lost.svg')),
  [MASCOT_POSE.DENIED]: pose(() => import('@/shared/assets/mascot/denied.svg')),
  [MASCOT_POSE.IDLE]: pose(() => import('@/shared/assets/mascot/idle.svg')),
} satisfies Record<MascotPose, unknown>;

interface MascotProps {
  /** Which drawing. */
  pose: MascotPose;

  /** Merged onto the root; a `size-*` here replaces the default, which scales with the viewport. */
  className?: string;
}

/**
 * The dragon, inline. Theme-agnostic: the drawing carries a class per body
 * part and `src/styles/mascot.css` colors them from the Theme's tokens, so
 * `standard` and `dark-fantasy` share one file per pose. Always decorative —
 * the surface's copy is the whole message.
 *
 * A client component for the bundle, not the browser: Next sends every
 * page's `not-found`, `unauthorized` and `forbidden` trees along with the page,
 * so a pose rendered on the server rides into every payload as markup. As a
 * client reference it is a name until the boundary actually shows.
 */
function Mascot({ pose, className }: MascotProps) {
  const Drawing = POSE[pose];

  // The box is the root's, so it holds its size while a chunk is in flight
  // and nothing shifts when the drawing lands.
  return (
    <span
      aria-hidden="true"
      className={cn('mascot block size-[clamp(10rem,25vw,16rem)]', className)}
    >
      {/* A chunk that fails to fetch leaves the box empty rather than taking the surface down. */}
      <SilentBoundary>
        <Drawing className="size-full" />
      </SilentBoundary>
    </span>
  );
}

export type { MascotProps };
export { Mascot };
