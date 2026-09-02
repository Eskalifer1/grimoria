'use client';

import { useState } from 'react';

import type { FieldValues } from 'react-hook-form';

import { SUBMIT_LOCK, VALUE_OWNER } from '@/constants/form';
import { type FormOptions, type FormResult, useFormSeam } from '@/shared/hooks/form/useFormSeam';
import { drawnFieldErrors, type FormFailure } from '@/shared/lib/formStatus';

/**
 * A form whose write nothing else owns — **pattern C, the blocking write**. The
 * answer cannot be guessed, so the form waits for it, holds the failure it came
 * back with, and refuses a second submit until the first is home
 * (`docs/features/data-access/pattern-c.md`).
 *
 * **The action answers with the values it saved**, and those are what the form
 * holds afterwards — a name the server trimmed reaches the input, and nothing
 * else can tell the form about it. A form whose value a store owns takes
 * `useOptimisticForm`.
 */
function useActionForm<TInput extends FieldValues, TOutput extends FieldValues = TInput>(
  options: FormOptions<TInput, TOutput, TInput>,
): FormResult<TInput, TOutput> {
  const { form, runWrite } = useFormSeam(options, VALUE_OWNER.FORM);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const fieldErrors = drawnFieldErrors(failure, options.values);

  async function onSubmit(submitted: TOutput) {
    const { result } = await runWrite(submitted);

    setFailure(result.error);

    if (result.data) {
      form.reset(result.data);
    }
  }

  return {
    form,
    writeStatus: {
      // A reason no field took has to stay in the footer, or it is lost.
      error: Object.keys(fieldErrors).length > 0 ? null : failure,
      fieldErrors,
      dismiss: () => setFailure(null),
      isPending: form.formState.isSubmitting,
      submitLock: SUBMIT_LOCK.SUBMIT,
    },
    onSubmit,
  };
}

export { useActionForm };
