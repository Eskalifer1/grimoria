'use client';

import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import { VALUE_OWNER } from '@/constants/form';
import { type FormOptions, type FormResult, useFormSeam } from '@/shared/hooks/form/useFormSeam';
import type { FormStatus } from '@/shared/lib/formStatus';

interface UseOptimisticFormOptions<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
  TData = unknown,
> extends FormOptions<TInput, TOutput, TData> {
  /**
   * The state of the write, which the store already holds —
   * `optimisticFormStatus(field, value)` turns a `useOptimisticValue` result into
   * one, so the form layer never imports the store. **The store is also what
   * moves `values`**; bound to anything that does not answer, the form snaps back
   * to a stale value the moment a write lands.
   */
  writeStatus: FormStatus;
}

/**
 * Drops the dirty mark from every field nothing was typed into since the write
 * went out, so the store's answer reaches the input. `resetField` per field is
 * the only reset that re-pins one default and recomputes its dirtiness.
 */
function releaseFields<TInput extends FieldValues, TOutput extends FieldValues>(
  form: UseFormReturn<TInput, unknown, TOutput>,
  sent: TInput,
): void {
  const current = form.getValues();

  for (const field of Object.keys(sent) as Array<FieldPath<TInput>>) {
    // Typed into while the write was out: still a draft, and a newer one.
    if (current[field] === sent[field]) {
      form.resetField(field);
    }
  }
}

/**
 * A form whose write a store already owns — **pattern B, the optimistic write**.
 * The value changes on the keystroke that submits it and the failure survives a
 * reload, so this hook records nothing: a second copy of the answer would render
 * for a value nothing reads (`docs/features/data-access/pattern-b.md`).
 *
 * `values` is a live binding here, so a name the server normalized reaches the
 * input. A form nothing else owns takes `useActionForm`.
 */
function useOptimisticForm<TInput extends FieldValues, TOutput extends FieldValues, TData>({
  writeStatus,
  ...options
}: UseOptimisticFormOptions<TInput, TOutput, TData>): FormResult<TInput, TOutput> {
  const { form, runWrite } = useFormSeam(options, VALUE_OWNER.SURFACE);

  async function onSubmit(submitted: TOutput) {
    const { sent } = await runWrite(submitted);

    // Refused or accepted alike: the store answers with the value either way.
    releaseFields(form, sent);
  }

  return { form, writeStatus, onSubmit };
}

export type { UseOptimisticFormOptions };
export { useOptimisticForm };
