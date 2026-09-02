'use client';

import type { RefObject } from 'react';

import { ErrorRow } from '@/shared/components/ErrorRow';
import { useWriteStatus } from '@/shared/hooks/useWriteStatus';

interface FormErrorProps {
  /**
   * Where focus goes once the message is dismissed. Needs `tabIndex={-1}` unless
   * it is already focusable; without it, focus falls to the nearest ancestor.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The message for a failure belonging to the write rather than to one field — no
 * session, no right, offline. A failure the server named a field for is drawn by
 * that field, and never here as well.
 *
 * A form may leave this out and nothing stops it; rendering it implicitly would
 * break on the first wrapper around a child.
 */
function FormError({ returnFocusTo, className }: FormErrorProps) {
  const { error, dismiss } = useWriteStatus();

  return (
    <ErrorRow
      className={className}
      errors={error ? [error] : []}
      onDismiss={dismiss ?? undefined}
      returnFocusTo={returnFocusTo}
    />
  );
}

export type { FormErrorProps };
export { FormError };
