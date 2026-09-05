import type { FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldControl } from '@/shared/components/Form/FormField';

/**
 * The one adapter between `Form.Field`'s `value`/`onChange` and the
 * `checked`/`onCheckedChange` every Radix toggle wants. `=== true` on both sides:
 * the field reads `undefined` until seeded, and Radix types `'indeterminate'` in.
 */
function toggleBinding<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  value,
  onChange,
  ...field
}: FormFieldControl<TValues, TName>) {
  return {
    ...field,
    checked: value === true,
    onCheckedChange: (checked: boolean | 'indeterminate') => onChange(checked === true),
  };
}

export { toggleBinding };
