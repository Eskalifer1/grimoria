'use client';

import { type RefObject, useId, useRef } from 'react';

import { DismissErrorButton } from '@/shared/components/MessageRow/DismissErrorButton';
import { useReturnFocus } from '@/shared/hooks/useReturnFocus';
import { cn } from '@/shared/lib/cn';

interface MessageRowProps {
  /** What to say, already worded. Repeats and `null`s are dropped. */
  sentences: ReadonlyArray<string | null>;

  /** Throws the attempt away — the message and the value it belongs to. Omitted where nothing may be. */
  onDismiss?: () => void;

  /** What a control points `aria-describedby` at. Generated when the caller needs none. */
  id?: string;

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
 * The message under the element it belongs to, drawn and nothing more — the
 * caller has already decided what it says. `ErrorRow` is the one to reach for
 * where the caller holds failures rather than sentences.
 *
 * Mounted whether or not it has anything to say (`accessibility.md`), and
 * `sr-only` while empty so it adds no gap. shadcn's `Alert` is the boxed callout
 * for a whole surface; this is the inline line under one control.
 */
function MessageRow({ sentences, onDismiss, id, returnFocusTo, className }: MessageRowProps) {
  const fallbackId = useId();
  const messageId = id ?? fallbackId;
  const region = useRef<HTMLSpanElement>(null);
  const returnFocus = useReturnFocus(region, returnFocusTo);
  const shown = [...new Set(sentences)].filter((sentence) => sentence !== null);

  if (shown.length === 0) {
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
        {shown.map((sentence) => (
          <span key={sentence}>{sentence}</span>
        ))}
      </span>
      {onDismiss ? (
        <DismissErrorButton describedBy={messageId} onDismiss={() => returnFocus(onDismiss)} />
      ) : null}
    </span>
  );
}

export type { MessageRowProps };
export { MessageRow };
