'use client';

import { type ReactNode, type RefObject, useRef } from 'react';

import {
  type FieldValues,
  FormProvider,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { ErrorRow } from '@/shared/components/ErrorRow';
import { FormActions } from '@/shared/components/Form/FormActions';
import { FormControl } from '@/shared/components/Form/FormControl';
import { FormFieldMessage } from '@/shared/components/Form/FormFieldMessage';
import { FormDescription, FormField, FormItem, FormLabel } from '@/shared/components/ui/form';
import { cn } from '@/shared/lib/cn';
import type { OptimisticFailure } from '@/shared/lib/optimistic/entry';

interface FormProps<TValues extends FieldValues> {
  /** The `useForm` return. Published on context, so no field is handed a `control` prop. */
  form: UseFormReturn<TValues>;

  /** Runs with the parsed values once the resolver has agreed to them. */
  onSubmit: SubmitHandler<TValues>;

  /** The fields, and whatever else the form holds. */
  children: ReactNode;

  /**
   * Why the last write failed, when the reason is the form's rather than one
   * field's — no session, no right, offline. A field's own reason belongs to its
   * `FormFieldMessage`, and passing it here as well prints it twice.
   */
  error?: OptimisticFailure | null;

  /** Throws that failure away. Omitted where nothing may be dismissed. */
  onDismiss?: () => void;

  /** Where focus goes once the message is dismissed. Defaults to the submit row. */
  returnFocusTo?: RefObject<HTMLElement | null>;

  /** The submit button's label. Omitted only by a form that draws its own actions. */
  submitLabel?: string;

  /** Whether a write is out, so the submit button can say so without being disabled. */
  isPending?: boolean;

  /** Shows a cancel button beside submit. */
  onCancel?: () => void;

  /** The cancel button's label. Defaults to the shared word. */
  cancelLabel?: string;

  /** Additional classes, merged onto the `<form>` element. */
  className?: string;
}

/**
 * A form, the context its fields read from, and the two things every form ends
 * with: the message for a failure belonging to no single field, and the submit
 * row. Written per form, each one would decide the order and the focus return
 * again, and a form that forgot the message would refuse silently.
 *
 * `noValidate`: the schema is the contract, and the browser's own bubbles would
 * word the same refusal untranslated and outside the Theme.
 *
 * Compose it with `FormField`, `FormItem`, `FormLabel`, `FormControl` and
 * `FormFieldMessage`, all re-exported here so a surface has one import.
 */
function Form<TValues extends FieldValues>({
  form,
  onSubmit,
  children,
  error,
  onDismiss,
  returnFocusTo,
  submitLabel,
  isPending,
  onCancel,
  cancelLabel,
  className,
}: FormProps<TValues>) {
  const submit = useRef<HTMLButtonElement>(null);

  return (
    <FormProvider {...form}>
      <form
        className={cn('flex flex-col gap-4', className)}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {children}

        {/* Above the submit row, so the reason is read before the control that
            would repeat the write. */}
        <ErrorRow
          errors={error ? [error] : []}
          onDismiss={onDismiss}
          returnFocusTo={returnFocusTo ?? submit}
        />

        {submitLabel ? (
          <FormActions
            cancelLabel={cancelLabel}
            isPending={isPending}
            onCancel={onCancel}
            submitLabel={submitLabel}
            submitRef={submit}
          />
        ) : null}
      </form>
    </FormProvider>
  );
}

export type { FormProps };
export {
  Form,
  FormActions,
  FormControl,
  FormDescription,
  FormField,
  FormFieldMessage,
  FormItem,
  FormLabel,
};
