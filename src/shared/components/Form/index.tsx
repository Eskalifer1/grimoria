'use client';

import type { BaseSyntheticEvent, ReactNode } from 'react';

import {
  type FieldValues,
  FormProvider,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { SUBMIT_LOCK } from '@/constants/form';
import { FormActions } from '@/shared/components/Form/FormActions';
import { FormCancel } from '@/shared/components/Form/FormCancel';
import { FormError } from '@/shared/components/Form/FormError';
import { FormField } from '@/shared/components/Form/FormField';
import { FormFooter } from '@/shared/components/Form/FormFooter';
import { FormReset } from '@/shared/components/Form/FormReset';
import { FormSubmit } from '@/shared/components/Form/FormSubmit';
import { useSkipWhilePending } from '@/shared/hooks/useSkipWhilePending';
import { WriteStatusContext } from '@/shared/hooks/useWriteStatus';
import { cn } from '@/shared/lib/cn';
import { type FormStatus, IDLE_FORM_STATUS } from '@/shared/lib/formStatus';

interface FormRootProps<TValues extends FieldValues> {
  /** The `useForm` return. Published on context, so no field is handed a `control` prop. */
  form: UseFormReturn<TValues>;

  /** Runs with the parsed values once the resolver has agreed to them. */
  onSubmit: SubmitHandler<TValues>;

  /** The content to render inside the form — its fields, and whatever else it holds. */
  children: ReactNode;

  /** What the server has said about the write. Idle where the form runs no write of its own. */
  writeStatus?: FormStatus;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The form element and the two contexts its parts read from: what the User typed
 * comes from `useFormContext()`, what the server said from `useWriteStatus()`.
 *
 * `noValidate`: the schema is the contract, and the browser's own bubbles would
 * word the same refusal untranslated and outside the Theme.
 *
 * **The submit lock is held here, not on the button.** `Form.Submit` only says it
 * is refusing; the refusal itself has to sit on the form, or the Enter key sends
 * a second write no button was ever clicked for.
 *
 * Takes the whole of `useActionForm`'s return — `<Form.Root {...nameForm}>`.
 */
function FormRoot<TValues extends FieldValues>({
  form,
  onSubmit,
  children,
  writeStatus,
  className,
}: FormRootProps<TValues>) {
  const write = writeStatus ?? IDLE_FORM_STATUS;
  const isSubmitLocked = write.submitLock === SUBMIT_LOCK.SUBMIT;
  const submitOnce = useSkipWhilePending(form.handleSubmit(onSubmit), isSubmitLocked);

  function handleSubmit(event: BaseSyntheticEvent) {
    // `isPending` covers a write this form did not start — one restored from the
    // store on a reload; `submitOnce` covers the repeat that arrives before a
    // render, which `isPending` cannot have heard about yet.
    const isRefused = isSubmitLocked && write.isPending;

    if (isRefused || !submitOnce(event)) {
      event.preventDefault();
    }
  }

  return (
    <FormProvider {...form}>
      <WriteStatusContext value={write}>
        <form className={cn('flex flex-col gap-4', className)} noValidate onSubmit={handleSubmit}>
          {children}
        </form>
      </WriteStatusContext>
    </FormProvider>
  );
}

/**
 * The form layer, reached through one import. Dot notation because this family is
 * ours rather than vendored, and what a form varies it varies by children —
 * `Form.Footer` is the preset most forms want, and everything under it stays
 * reachable for a form that wants something else.
 *
 * See docs/features/forms.md.
 */
const Form = {
  Root: FormRoot,
  Field: FormField,
  Error: FormError,
  Actions: FormActions,
  Submit: FormSubmit,
  Cancel: FormCancel,
  Reset: FormReset,
  Footer: FormFooter,
};

export type { FormRootProps };
export { Form };
