import type { ReactNode } from 'react';

import type { FieldPath, FieldPathByValue, FieldValues } from 'react-hook-form';

import type { FormActions } from '@/shared/components/Form/FormActions';
import type { FormCancel } from '@/shared/components/Form/FormCancel';
import type { FormCheckboxProps } from '@/shared/components/Form/FormCheckbox';
import type { FormError } from '@/shared/components/Form/FormError';
import type { FormFieldProps } from '@/shared/components/Form/FormField';
import type { FormFooter } from '@/shared/components/Form/FormFooter';
import type { FormInputProps } from '@/shared/components/Form/FormInput';
import type { FormRadioGroupProps } from '@/shared/components/Form/FormRadioGroup';
import type { FormReset } from '@/shared/components/Form/FormReset';
import type { FormSelectProps } from '@/shared/components/Form/FormSelect';
import type { FormSubmit } from '@/shared/components/Form/FormSubmit';
import type { FormSwitchProps } from '@/shared/components/Form/FormSwitch';
import type { FormTextareaProps } from '@/shared/components/Form/FormTextarea';

/**
 * Which paths a control may bind to. Conditional because `unknown` is the "any
 * field will do" answer — a text control constrains the path alone, while a
 * toggle takes only the paths holding a `boolean`.
 */
type BoundPath<TValues extends FieldValues, TValue> = unknown extends TValue
  ? FieldPath<TValues>
  : FieldPathByValue<TValues, TValue>;

/**
 * One control of the untyped namespace, seen through the form's values: the same
 * props, with `name` narrowed from a bare `string` to a path the form actually
 * holds. `TValue` is what the field must hold, and `TName` is the control's only
 * inference site — which is why the props are given at their widest here.
 */
type BoundControl<TValues extends FieldValues, TProps, TValue = unknown> = <
  TName extends BoundPath<TValues, TValue>,
>(
  props: Omit<TProps, 'name'> & { name: TName },
) => ReactNode;

/** What the bound `Form.Root` still varies. The binding is the hook's; the rest is layout. */
interface TypedFormRootProps {
  /** The content to render inside the form — its fields, and whatever else it holds. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The `Form` namespace bound to one form's values, handed back by
 * `useOptimisticForm` and `useActionForm`. A mistyped `name`, or a toggle on a
 * `string` field, fails `tsc` at the call site — which context alone cannot do,
 * since context is not an inference site (ADR 0013).
 *
 * **One line per member, written by hand**: a control added to `Form` and not
 * listed here fails the assertion in `tests/shared/components/Form/types.test.tsx`.
 */
interface TypedForm<TValues extends FieldValues> {
  Root: (props: TypedFormRootProps) => ReactNode;
  Field: <TName extends FieldPath<TValues>>(props: FormFieldProps<TValues, TName>) => ReactNode;
  Input: BoundControl<TValues, FormInputProps<TValues, FieldPath<TValues>>>;
  Textarea: BoundControl<TValues, FormTextareaProps<TValues, FieldPath<TValues>>>;
  Checkbox: BoundControl<
    TValues,
    FormCheckboxProps<TValues, FieldPathByValue<TValues, boolean>>,
    boolean
  >;
  Switch: BoundControl<
    TValues,
    FormSwitchProps<TValues, FieldPathByValue<TValues, boolean>>,
    boolean
  >;
  Select: BoundControl<TValues, FormSelectProps<TValues, FieldPath<TValues>>, string>;
  RadioGroup: BoundControl<TValues, FormRadioGroupProps<TValues, FieldPath<TValues>>, string>;
  Error: typeof FormError;
  Actions: typeof FormActions;
  Submit: typeof FormSubmit;
  Cancel: typeof FormCancel;
  Reset: typeof FormReset;
  Footer: typeof FormFooter;
}

export type { BoundControl, BoundPath, TypedForm, TypedFormRootProps };
