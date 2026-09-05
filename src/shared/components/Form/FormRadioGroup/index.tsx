'use client';

import { type ComponentProps, useId } from 'react';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import { optionValue } from '@/shared/components/Form/optionValue';
import type { BoundControlProps, FormOption } from '@/shared/components/Form/types';
import { FieldLabel } from '@/shared/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';

// `orientation` is the field's word here — the group's own direction is a class.
// `onValueChange` is the binding's.
type RadioGroupControlProps = Omit<
  ComponentProps<typeof RadioGroup>,
  'onValueChange' | 'orientation'
>;

type FormRadioGroupProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = BoundControlProps<RadioGroupControlProps, TValues, TName> & {
  /** The values on offer, drawn in the order given. */
  options: readonly FormOption[];
};

/**
 * A single-choice group of radios bound to the form on context. The root is a
 * `<div role="radiogroup">` no `<label for>` can reach, so it is named by
 * `aria-labelledby` and the field's ref lands on a radio — a ref on the root
 * would drop a keyboard User to the body (WCAG 2.2 AA, 2.4.3).
 */
function FormRadioGroup<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation,
  required,
  disabled,
  options,
  ...control
}: FormRadioGroupProps<TValues, TName>) {
  const labelId = useId();

  return (
    <FormField<TValues, TName>
      description={description}
      hasLabelableControl={false}
      isDescriptionHidden={isDescriptionHidden}
      label={<span id={labelId}>{label}</span>}
      name={name}
      orientation={orientation}
      render={({ field }) => {
        const value = optionValue(field.value);
        // Focus returns to the checked radio, or to the first open one:
        // `.focus()` on a disabled button is a no-op and leaves it on `<body>`.
        const isOpen = (option: FormOption) => !option.disabled;
        const chosenIndex = options.findIndex((option) => option.value === value && isOpen(option));
        const focusIndex = chosenIndex === -1 ? options.findIndex(isOpen) : chosenIndex;

        return (
          <RadioGroup
            {...control}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
            aria-labelledby={labelId}
            aria-required={field['aria-required']}
            disabled={field.disabled ?? disabled}
            id={field.id}
            onBlur={field.onBlur}
            onValueChange={field.onChange}
            value={value}
          >
            {options.map((option, index) => {
              // From the position: a value with a space makes an id the spec
              // disallows, and the label stops naming its radio.
              const optionId = `${field.id}-${index}`;

              return (
                <div className="flex items-center gap-3" key={option.value}>
                  <RadioGroupItem
                    disabled={option.disabled}
                    id={optionId}
                    ref={index === focusIndex ? field.ref : undefined}
                    value={option.value}
                  />
                  <FieldLabel className="font-normal" htmlFor={optionId}>
                    {option.label}
                  </FieldLabel>
                </div>
              );
            })}
          </RadioGroup>
        );
      }}
      required={required}
    />
  );
}

export type { FormRadioGroupProps };
export { FormRadioGroup };
