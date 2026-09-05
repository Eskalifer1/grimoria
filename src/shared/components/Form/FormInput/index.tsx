'use client';

import type { ComponentProps } from 'react';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import type { BoundControlProps } from '@/shared/components/Form/types';
import { Input } from '@/shared/components/ui/input';

type FormInputProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = BoundControlProps<ComponentProps<typeof Input>, TValues, TName>;

/**
 * A text input bound to the form on context — the template every other bound
 * control copies. It draws its own `Form.Field`, so a call site writes `name` and
 * `label`, never a `render` prop, a `control` or a `register` result.
 */
function FormInput<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation,
  required,
  disabled,
  ...control
}: FormInputProps<TValues, TName>) {
  return (
    <FormField<TValues, TName>
      description={description}
      isDescriptionHidden={isDescriptionHidden}
      label={label}
      name={name}
      orientation={orientation}
      render={({ field }) => (
        <Input {...control} {...field} disabled={field.disabled ?? disabled} />
      )}
      required={required}
    />
  );
}

export type { FormInputProps };
export { FormInput };
