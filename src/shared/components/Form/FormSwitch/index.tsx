'use client';

import type { ComponentProps } from 'react';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';

import { FormField } from '@/shared/components/Form/FormField';
import { toggleBinding } from '@/shared/components/Form/toggleBinding';
import type { BoundControlProps } from '@/shared/components/Form/types';
import { Switch } from '@/shared/components/ui/switch';

type FormSwitchProps<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, boolean>,
> = BoundControlProps<
  Omit<ComponentProps<typeof Switch>, 'checked' | 'defaultChecked' | 'onCheckedChange'>,
  TValues,
  TName
>;

/**
 * A switch bound to the form on context, holding one `boolean`. Which of it and
 * `Form.Checkbox` a surface reaches for is a question of what the toggle means,
 * not of how it is bound — the wiring is identical.
 */
function FormSwitch<TValues extends FieldValues, TName extends FieldPathByValue<TValues, boolean>>({
  name,
  label,
  description,
  isDescriptionHidden,
  orientation = 'horizontal',
  isLabelFirst = false,
  required,
  disabled,
  ...control
}: FormSwitchProps<TValues, TName>) {
  return (
    <FormField<TValues, TName>
      description={description}
      isDescriptionHidden={isDescriptionHidden}
      label={label}
      name={name}
      isLabelFirst={isLabelFirst}
      orientation={orientation}
      render={({ field }) => (
        <Switch {...control} {...toggleBinding(field)} disabled={field.disabled ?? disabled} />
      )}
      required={required}
    />
  );
}

export type { FormSwitchProps };
export { FormSwitch };
