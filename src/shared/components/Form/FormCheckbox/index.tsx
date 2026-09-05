'use client';

import type { ComponentProps } from 'react';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import { toggleBinding } from '@/shared/components/Form/toggleBinding';
import type { BoundControlProps } from '@/shared/components/Form/types';
import { Checkbox } from '@/shared/components/ui/checkbox';

type FormCheckboxProps<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, boolean>,
> = BoundControlProps<
  Omit<ComponentProps<typeof Checkbox>, 'checked' | 'defaultChecked' | 'onCheckedChange'>,
  TValues,
  TName
>;

/**
 * A checkbox bound to the form on context, holding one `boolean`. A group of them
 * writing into an array is a `fieldset` with a `legend`, and another component.
 */
function FormCheckbox<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, boolean>,
>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation = 'horizontal',
  isLabelFirst = false,
  required,
  disabled,
  ...control
}: FormCheckboxProps<TValues, TName>) {
  return (
    <FormField<TValues, TName>
      description={description}
      isDescriptionHidden={isDescriptionHidden}
      label={label}
      name={name}
      isLabelFirst={isLabelFirst}
      orientation={orientation}
      render={({ field }) => (
        <Checkbox {...control} {...toggleBinding(field)} disabled={field.disabled ?? disabled} />
      )}
      required={required}
    />
  );
}

export type { FormCheckboxProps };
export { FormCheckbox };
