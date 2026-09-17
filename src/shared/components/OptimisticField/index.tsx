'use client';

import { useRef } from 'react';

import { ErrorRow } from '@/shared/components/ErrorRow';
import { InFlight } from '@/shared/components/InFlight';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';
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
 * over it, for a leaf that is the record's only surface: it says "saving" and
 * "refused" itself. Beside a form that already does, `OptimisticText` is the
 * whole mirror. Rendered from a client leaf that imports the descriptor — a
 * Server Component cannot hand one over, it holds functions.
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
  const error = errorScope === 'field' ? shown.fieldError : shown.error;
  const valueRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      className={cn('inline-flex min-w-0 flex-col gap-1', className)}
      ref={valueRef}
      tabIndex={-1}
    >
      <InFlight pendingAction={shown.pendingAction} className="wrap-anywhere">
        {shown.value}
      </InFlight>
      <ErrorRow onDismiss={shown.dismiss} returnFocusTo={valueRef} errors={error ? [error] : []} />
    </span>
  );
}

export type { OptimisticFieldProps };
export { OptimisticField };
