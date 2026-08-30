'use client';

import { useIsSyncing } from '@/shared/hooks/useIsSyncing';
import { cn } from '@/shared/lib/cn';

/** Both passes are one full-width bar scaled from its left edge — the keyframes do the width. */
const PASS = 'absolute inset-0 origin-left rounded-pill bg-status-live';

interface SyncProgressBarProps {
  /** Additional classes, merged onto the track. Where the bar sits is the caller's. */
  className?: string;
}

/**
 * The line that says the app is talking to the server: indeterminate, because a
 * write has no measurable progress, and drawn only once one has outlasted the
 * threshold every other pending state uses.
 *
 * Two passes, not one — the trail is at its widest while the lead is already
 * leaving, so the track is never empty and the loop has no seam to notice.
 *
 * `aria-hidden`: each surface already announces its own flight through
 * `aria-busy` and its status region, and a second voice for the same thing says
 * it twice (`accessibility.md`).
 *
 * The track keeps its height whether or not it has anything in it, so a write
 * never shifts what is under it.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function SyncProgressBar({ className }: SyncProgressBarProps) {
  const isSyncing = useIsSyncing();

  return (
    <div aria-hidden="true" className={cn('relative h-0.5 w-full overflow-hidden', className)}>
      {isSyncing ? (
        <>
          <span className={cn(PASS, 'animate-sync-sweep')} />
          {/* Behind the lead in weight as well as in time, so the two read as one
              movement rather than as two bars racing. */}
          <span className={cn(PASS, 'opacity-60', 'animate-sync-trail')} />
        </>
      ) : null}
    </div>
  );
}

export type { SyncProgressBarProps };
export { SyncProgressBar };
