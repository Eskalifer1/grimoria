'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
  useForm,
} from 'react-hook-form';
import type { z } from 'zod';

import { VALUE_OWNER, type ValueOwner } from '@/constants/form';
import { TOAST_SCOPE, type ToastMessageKey } from '@/constants/toast';
import type { TypedForm } from '@/shared/components/Form/typedForm';
import { runAction } from '@/shared/lib/action/runAction';
import type { ActionResult } from '@/shared/lib/actionResult';
import type { FormStatus } from '@/shared/lib/formStatus';

interface FormOptions<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
  TData = unknown,
> {
  /** The action's contract schema, checked here before the write and again on the server. */
  schema: z.ZodType<TOutput, TInput>;

  /**
   * What the form starts from, and — where a surface owns the value — what it
   * follows. **Every key here is a field the form draws**, since a key with no
   * `Form.Field` absorbs the server's reason for it and leaves the footer with
   * nothing to say.
   */
  values: TInput;

  /** Runs on what the schema produced, once it agrees. */
  write: (values: TOutput) => Promise<ActionResult<TData, string>>;

  /**
   * The `toast` copy key confirming a success, for a write whose result the
   * screen does not otherwise show. A form naming none confirms nothing.
   */
  successMessage?: ToastMessageKey;
}

interface FormResult<TInput extends FieldValues, TOutput extends FieldValues = TInput> {
  /**
   * The namespace this form draws with, already bound to it: `Form.Root` needs no
   * props of the binding, and every `name` under it is checked against `TInput`.
   */
  Form: TypedForm<TInput>;

  /** The `useForm` return — `watch`, `setValue`, `formState`. Still handed to the untyped `Form.Root`. */
  form: UseFormReturn<TInput, unknown, TOutput>;

  /** What the server has said, handed to `Form.Root`. */
  writeStatus: FormStatus;

  /** The submit handler, handed to `Form.Root`. */
  onSubmit: SubmitHandler<TOutput>;
}

interface FormSeam<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
  TData = unknown,
> {
  form: UseFormReturn<TInput, unknown, TOutput>;

  /** Runs the write, and answers with what it said and the raw values it went out with. */
  runWrite: (submitted: TOutput) => Promise<{ result: ActionResult<TData, string>; sent: TInput }>;
}

/**
 * Everything a form does regardless of who answers with its value: the `useForm`
 * call, the resolver, and the write. What is done with the answer belongs to the
 * owner — `useOptimisticForm` and `useActionForm`.
 *
 * **Who owns the write owns the value.** Surface-owned, `values` is a live
 * binding and the input follows the store; form-owned, it is a seed, because
 * nothing outside will ever answer.
 */
function useFormSeam<TInput extends FieldValues, TOutput extends FieldValues, TData>(
  { schema, values, write, successMessage }: FormOptions<TInput, TOutput, TData>,
  owner: ValueOwner,
): FormSeam<TInput, TOutput, TData> {
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    // Refused once the field is left, not only once the write is attempted.
    mode: 'onTouched',
    // `resetOptions` belongs to the surface-owned branch alone — it governs the
    // reset a `values` change fires, and a form-owned one has no `values`
    // (`docs/features/forms.md`).
    ...(owner === VALUE_OWNER.SURFACE
      ? { values, resetOptions: { keepDirtyValues: true, keepErrors: true } }
      : // `DeepPartial` refuses a value of an unresolved generic.
        { defaultValues: values as unknown as DefaultValues<TInput> }),
  });

  async function runWrite(submitted: TOutput) {
    // Raw, not the schema's output: it is what a field's own value is compared
    // against to tell a draft from a value already sent.
    const sent = form.getValues();

    // `Form.Error` draws every failure no field took, so a toast beside it would
    // state one problem twice. A success has nowhere else to go, so it speaks.
    const result = await runAction(() => write(submitted), {
      toast: { scope: TOAST_SCOPE.NONE, successMessage },
    });

    return { result, sent };
  }

  return { form, runWrite };
}

export type { FormOptions, FormResult, FormSeam };
export { useFormSeam };
