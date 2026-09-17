'use client';

import { InFlight } from '@/shared/components/InFlight';
import { useOptimisticRead } from '@/shared/hooks/useOptimisticRead';

interface OptimisticTextProps {
  /** The record's key, from the builder in `src/constants/cacheTags.ts`. */
  storeKey: string;

  /** The field to read out of the patch. */
  field: string;

  /** The server-confirmed text, re-read on every render. */
  value: string;

  /** The server's `updatedAt` for that value. What decides when the overlay is superseded. */
  version?: string | null;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * A text the store may have a newer value for, drawn as the store sees it —
 * `InFlight` while a write is out, never the failure: the surface that owns the
 * write says that. Every prop is a string, so a Server Component renders it in
 * place of the value.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function OptimisticText({ storeKey, field, value, version, className }: OptimisticTextProps) {
  const shown = useOptimisticRead({ key: storeKey, field, value, version });

  return (
    <InFlight pendingAction={shown.pendingAction} className={className}>
      {shown.value}
    </InFlight>
  );
}

export type { OptimisticTextProps };
export { OptimisticText };
