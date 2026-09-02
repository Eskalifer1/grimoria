'use client';

import { useRef } from 'react';

import { ErrorRow } from '@/shared/components/ErrorRow';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';
import { usePendingDelay } from '@/shared/hooks/usePendingDelay';
import { cn } from '@/shared/lib/cn';
import type { OptimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

interface OptimisticFieldProps<TInput, TData, TField extends Extract<keyof TInput, string>> {
  /** The write this field is under — where its key, its action and its value mapping come from. */
  descriptor: OptimisticDescriptor<TInput, TData>;

  /** What identifies the record being written. The key is built from it, by the descriptor. */
  input: NoInfer<TInput>;

  /** The field this element renders, in the action's input and in the patch alike. */
  field: TField;

  /** The server-confirmed text, re-read on every render. */
  value: TInput[TField] & string;

  /** The server's `updatedAt` for that value. What decides when the overlay is superseded. */
  version?: string | null;

  /**
   * Which failures this leaf draws. `'record'` (the default) is for a field that
   * is the whole surface; `'field'` is for a leaf inside an `OptimisticRow`,
   * which already draws the record's own and would otherwise print it twice.
   */
  errorScope?: 'record' | 'field';

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * One field of a record, drawn from the server's value with the store's patch
 * over it. The answer to "a Server Component cannot subscribe": the parent stays
 * on the server and only a string crosses into the browser.
 *
 * Read-only by design. See docs/features/data-access/pattern-b.md.
 */
function OptimisticField<TInput, TData, TField extends Extract<keyof TInput, string>>({
  descriptor,
  input,
  field,
  value,
  version,
  errorScope,
  className,
}: OptimisticFieldProps<TInput, TData, TField>) {
  const shown = useOptimisticValue({ descriptor, input, field, value, version });
  const isSlow = usePendingDelay(shown.isPending);
  const error = errorScope === 'field' ? shown.fieldError : shown.error;
  const valueRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      className={cn('inline-flex min-w-0 flex-col gap-1', className)}
      ref={valueRef}
      tabIndex={-1}
    >
      <span
        aria-busy={isSlow || undefined}
        // 70%, not 60%: at 60% the value measured 4.02:1 on the card in
        // `standard`, under the 4.5:1 `accessibility.md` holds.
        className={cn('wrap-anywhere transition-opacity', isSlow && 'opacity-70')}
      >
        {shown.value}
      </span>
      <ErrorRow onDismiss={shown.dismiss} returnFocusTo={valueRef} errors={error ? [error] : []} />
    </span>
  );
}

export type { OptimisticFieldProps };
export { OptimisticField };
