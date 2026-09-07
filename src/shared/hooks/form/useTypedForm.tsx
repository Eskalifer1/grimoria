'use client';

import { useMemo, useRef } from 'react';

import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';

import { Form } from '@/shared/components/Form';
import type { TypedForm, TypedFormRootProps } from '@/shared/components/Form/typedForm';
import type { FormStatus } from '@/shared/lib/formStatus';

interface TypedFormBinding<TInput extends FieldValues, TOutput extends FieldValues> {
  /** The `useForm` return the bound `Form.Root` publishes on context. */
  form: UseFormReturn<TInput, unknown, TOutput>;

  /** What the server has said about the write. */
  writeStatus: FormStatus;

  /** Runs with the parsed values once the resolver has agreed to them. */
  onSubmit: SubmitHandler<TOutput>;
}

/**
 * The `Form` namespace bound to one form: the same components, with a `Form.Root`
 * that already holds the binding and a `name` checked against `TInput` rather than
 * against `string` (`docs/features/forms.md`).
 *
 * `name` is checked against the schema's **input**: a control writes into the
 * field, so a `z.string().transform(Number)` field holds the string, not the number.
 */
function useTypedForm<TInput extends FieldValues, TOutput extends FieldValues>(
  binding: TypedFormBinding<TInput, TOutput>,
): TypedForm<TInput> {
  const live = useRef(binding);

  live.current = binding;

  // Built once: a `Root` closing over a fresh binding is a new component type every
  // render, and React remounts the whole form under it. The ref is how that one
  // component still reads the current binding, and why the compiler skips this hook.
  return useMemo(() => {
    function BoundRoot({ children, className }: TypedFormRootProps) {
      const { form, onSubmit, writeStatus } = live.current;

      return (
        <Form.Root className={className} form={form} onSubmit={onSubmit} writeStatus={writeStatus}>
          {children}
        </Form.Root>
      );
    }

    return { ...Form, Root: BoundRoot };
  }, []);
}

export type { TypedFormBinding };
export { useTypedForm };
