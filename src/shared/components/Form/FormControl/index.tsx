'use client';

import type { ComponentProps } from 'react';

import { Slot } from 'radix-ui';

import { useFormField } from '@/shared/components/ui/form';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';

interface FormControlProps extends ComponentProps<typeof Slot.Root> {
  /** The store's failure for this field, when the surface writes optimistically. */
  error?: OptimisticFailure | null;
}

/**
 * The control of a field, given the ARIA its message needs so no call site writes
 * `aria-invalid` or `aria-describedby` by hand.
 *
 * Ours rather than the vendored `FormControl` because a field is rejected in two
 * places — the schema before the write, the server after it — and the primitive
 * knows only the first.
 */
function FormControl({ error, ...props }: FormControlProps) {
  const { error: rejected, formItemId, formMessageId } = useFormField();
  const isInvalid = !!rejected || !!error;

  return (
    <Slot.Root
      // The message only, and only while there is one: the vendored control
      // also names a description id that may never have been rendered, and a
      // dangling `aria-describedby` is read as nothing at all.
      aria-describedby={isInvalid ? formMessageId : undefined}
      aria-invalid={isInvalid}
      data-slot="form-control"
      id={formItemId}
      {...props}
    />
  );
}

export type { FormControlProps };
export { FormControl };
