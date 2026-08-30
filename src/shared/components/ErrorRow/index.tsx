'use client';

import { type RefObject, useId, useRef } from 'react';

import { DismissErrorButton } from '@/shared/components/ErrorRow/DismissErrorButton';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { useReturnFocus } from '@/shared/hooks/useReturnFocus';
import { cn } from '@/shared/lib/cn';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';

interface ErrorRowProps {
  /** Every failure recorded against the element. Two attempts that failed the same way read as one. */
  errors: readonly OptimisticFailure[];

  /** Throws the attempt away — the message and the value it belongs to. Omitted where nothing may be. */
  onDismiss?: () => void;

  /**
   * What to focus once the message is gone. Needs `tabIndex={-1}` to accept it.
   * A dismissal sometimes takes this element with it — a create that failed is
   * thrown away row and all — and the nearest ancestor still standing is the
   * fallback then.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The message under the element it belongs to. Errors are never delayed the way
 * flight is — a failure the User has already moved past is the one thing they
 * must still be told about.
 *
 * Mounted whether or not it has anything to say (`accessibility.md`), and
 * `sr-only` while empty so it adds no gap. shadcn's `Alert` is the boxed callout
 * for a whole surface; this is the inline line under one control.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function ErrorRow({ errors, onDismiss, returnFocusTo, className }: ErrorRowProps) {
  const errorMessage = useActionErrorMessage();
  const messageId = useId();
  const region = useRef<HTMLSpanElement>(null);
  const returnFocus = useReturnFocus(region, returnFocusTo);
  const sentences = [...new Set(errors.map(errorMessage))].filter((sentence) => !!sentence);

  if (sentences.length === 0) {
    return <span className="sr-only" role="alert" />;
  }

  return (
    <span
      className={cn(
        'flex items-start gap-2 wrap-anywhere text-status-failed font-meta text-xs',
        className,
      )}
      ref={region}
      role="alert"
    >
      <span className="flex grow flex-col gap-1" id={messageId}>
        {sentences.map((sentence) => (
          <span key={sentence}>{sentence}</span>
        ))}
      </span>
      {onDismiss ? (
        <DismissErrorButton describedBy={messageId} onDismiss={() => returnFocus(onDismiss)} />
      ) : null}
    </span>
  );
}

export type { ErrorRowProps };
export { ErrorRow };
