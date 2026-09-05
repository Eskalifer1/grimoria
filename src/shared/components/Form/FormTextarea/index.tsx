'use client';

import type { ComponentProps } from 'react';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import type { BoundControlProps } from '@/shared/components/Form/types';
import { Textarea } from '@/shared/components/ui/textarea';

type FormTextareaProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = BoundControlProps<ComponentProps<typeof Textarea>, TValues, TName>;

/** A multi-line text control bound to the form on context; see `Form.Input`. */
function FormTextarea<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation,
  required,
  disabled,
  ...control
}: FormTextareaProps<TValues, TName>) {
  return (
    <FormField<TValues, TName>
      description={description}
      isDescriptionHidden={isDescriptionHidden}
      label={label}
      name={name}
      orientation={orientation}
      render={({ field }) => (
        <Textarea {...control} {...field} disabled={field.disabled ?? disabled} />
      )}
      required={required}
    />
  );
}

export type { FormTextareaProps };
export { FormTextarea };
