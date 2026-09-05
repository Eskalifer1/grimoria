'use client';

import type { ComponentProps } from 'react';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import { optionValue } from '@/shared/components/Form/optionValue';
import type { BoundControlProps, FormOption } from '@/shared/components/Form/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

// `children` is the trigger's own value; `onValueChange` and `value` are the
// root's, and the binding writes both.
type SelectControlProps = Omit<ComponentProps<typeof SelectTrigger>, 'children' | 'onValueChange'>;

type FormSelectProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = BoundControlProps<SelectControlProps, TValues, TName> & {
  /** The values on offer, drawn in the order given. */
  options: readonly FormOption[];

  /** Drawn on the trigger while nothing is chosen. */
  placeholder?: string;
};

/**
 * A single-choice list bound to the form on context. **The adapter is the point**:
 * `Form.Field` hands over `value`/`onChange`, Radix wants `value`/`onValueChange`.
 * The call site's props reach the trigger — the only one of the three with a DOM
 * node of its own — while `disabled` goes to the root, which closes all three.
 */
function FormSelect<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation,
  required,
  disabled,
  options,
  placeholder,
  ...control
}: FormSelectProps<TValues, TName>) {
  return (
    <FormField<TValues, TName>
      description={description}
      isDescriptionHidden={isDescriptionHidden}
      label={label}
      name={name}
      orientation={orientation}
      render={({ field }) => (
        <Select
          disabled={field.disabled ?? disabled}
          onValueChange={field.onChange}
          value={optionValue(field.value)}
        >
          <SelectTrigger
            {...control}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
            aria-required={field['aria-required']}
            id={field.id}
            onBlur={field.onBlur}
            ref={field.ref}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem disabled={option.disabled} key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      required={required}
    />
  );
}

export type { FormSelectProps };
export { FormSelect };
