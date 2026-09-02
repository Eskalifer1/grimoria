'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';

import { FormActions } from '@/shared/components/Form/FormActions';
import { FormCancel } from '@/shared/components/Form/FormCancel';
import { FormError } from '@/shared/components/Form/FormError';
import { FormSubmit } from '@/shared/components/Form/FormSubmit';

interface FormFooterProps {
  /** The submit button's label. Defaults to the shared word. */
  submitLabel?: ReactNode;

  /** Shows a cancel button beside submit. Omitted where there is nothing to go back to. */
  onCancel?: () => void;

  /** The cancel button's label. Defaults to the shared word. */
  cancelLabel?: ReactNode;

  /** Additional classes, merged onto the action row. */
  className?: string;
}

/**
 * What most forms end with: the message for a failure belonging to no field,
 * above the control that would repeat the write, and the submit row under it.
 *
 * A form needing anything else drops to `Form.Error`, `Form.Actions`,
 * `Form.Submit` and `Form.Cancel` rather than waiting for a prop here.
 */
function FormFooter({ submitLabel, onCancel, cancelLabel, className }: FormFooterProps) {
  const submit = useRef<HTMLButtonElement>(null);

  return (
    <>
      <FormError returnFocusTo={submit} />
      <FormActions className={className}>
        <FormSubmit ref={submit}>{submitLabel}</FormSubmit>
        {onCancel ? <FormCancel onCancel={onCancel}>{cancelLabel}</FormCancel> : null}
      </FormActions>
    </>
  );
}

export type { FormFooterProps };
export { FormFooter };
