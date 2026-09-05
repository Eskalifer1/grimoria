import type { ReactNode } from 'react';

import type { FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldProps } from '@/shared/components/Form/FormField';

/**
 * The bound-control template: the control's own props, minus what the binding
 * writes, plus the field `Form.Field` draws around it. Writing a dropped name is
 * a type error rather than a prop the spread would discard. `disabled` stays
 * passable, and the rest spreads flat onto the control.
 *
 * **Two holes it cannot close.** Hyphenated JSX attributes escape prop checking,
 * so a call site's `aria-invalid`, `aria-describedby` or `aria-required` compiles
 * and is then overwritten. And `TValues` has no inference site — the form comes
 * from context — so `name` is checked as a bare `string`.
 */
type BoundControlProps<
  TControl,
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = Omit<
  TControl,
  'defaultValue' | 'id' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'required' | 'value'
> &
  Pick<
    FormFieldProps<TValues, TName>,
    | 'description'
    | 'isDescriptionHidden'
    | 'isLabelFirst'
    | 'label'
    | 'name'
    | 'orientation'
    | 'required'
  >;

/**
 * One value on offer in an option-bound control. Shared by `Form.Select` and
 * `Form.RadioGroup` because both offer the same thing and both settle on a
 * string, so a call site moving between them rewrites nothing.
 */
interface FormOption {
  /**
   * What the form settles on. **Never `''`** — that is the unset state, and a
   * `Select` handed it falls back to its placeholder. A "none" choice needs a
   * sentinel of its own.
   */
  value: string;

  /** What is drawn, and the option's accessible name. */
  label: ReactNode;

  /** Whether this one option is closed off while the rest stay open. */
  disabled?: boolean;
}

export type { BoundControlProps, FormOption };
