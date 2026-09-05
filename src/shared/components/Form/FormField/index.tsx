'use client';

import { type ComponentProps, type ReactNode, useId, useRef } from 'react';

import {
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { REQUIRED_MARK } from '@/constants/form';
import { MessageRow } from '@/shared/components/MessageRow';
import { Field, FieldDescription, FieldLabel } from '@/shared/components/ui/field';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { useValidationMessage } from '@/shared/hooks/useValidationMessage';
import { useWriteStatus } from '@/shared/hooks/useWriteStatus';
import { cn } from '@/shared/lib/cn';

/** The control's props: react-hook-form's, plus the wiring no call site should write by hand. */
type FormFieldControl<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = ControllerRenderProps<TValues, TName> & {
  /** The id the label points at, so the control resolves to a name. */
  id: string;

  /** Whether this field stands refused, by the resolver or by the server. */
  'aria-invalid': boolean;

  /** The description and the message, whichever of the two was rendered. */
  'aria-describedby': string | undefined;

  /** Whether the field must be filled, for anything that reads the control rather than the label. */
  'aria-required': boolean;
};

interface FormFieldRenderProps<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  /** Spread onto the control. Carries the value, the handlers, the id and the ARIA. */
  field: FormFieldControl<TValues, TName>;

  /** The one reason this field is refused, already worded, or `null` while it is accepted. */
  error: string | null;
}

interface FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  /** The field's path in the form's values. */
  name: TName;

  /**
   * Drawn above the control, and the control's accessible name. Required — with
   * it optional, a call site that forgets renders a control that resolves to no
   * name at all (WCAG 2.2 AA, 4.1.2). A field that must show none passes an
   * `sr-only` element.
   */
  label: ReactNode;

  /**
   * The rule the User needs before typing — a bound, a format, an example. Always
   * reaches the control's accessible description (WCAG 2.2 AA, 3.3.2); drawn on
   * screen only where a sighted User would otherwise be surprised.
   */
  description?: ReactNode;

  /** Whether the description is for a screen reader alone, rather than drawn under the label. */
  isDescriptionHidden?: boolean;

  /** Marks the field as one that must be filled: a red `*` by the label, `aria-required` on the control. */
  required?: boolean;

  /** How the label and the control sit against each other. The vendored `Field` owns what each word draws. */
  orientation?: ComponentProps<typeof Field>['orientation'];

  /**
   * Whether the control can carry a `<label for>`. A `role="radiogroup"` cannot,
   * and names itself with `aria-labelledby` instead of taking a dead `for`.
   */
  hasLabelableControl?: boolean;

  /**
   * Whether the label is drawn before the control. Only `horizontal` sees it: the
   * label has `flex-auto` there, so first pushes the control to the far edge — the
   * settings row — and after sits it against the control, where a toggle's word
   * belongs (GOV.UK, Carbon and shadcn's own `Field` example put the box first).
   */
  isLabelFirst?: boolean;

  /** Draws the control. Spread `field` onto it; `error` is there for a control that wants it. */
  render: (props: FormFieldRenderProps<TValues, TName>) => ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/** The ids a control actually describes. A dangling one is read as nothing, and silences the rest. */
function describedBy(ids: ReadonlyArray<string | null>): string | undefined {
  const named = ids.filter((id) => id !== null);

  return named.length ? named.join(' ') : undefined;
}

/**
 * One field: its label, its control, and the one message under it. All this adds
 * to `Controller` is the merge — a field is refused in two places, by the resolver
 * before the write and by the server after it, and the render prop is handed a
 * single `error`.
 */
function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  label,
  description,
  isDescriptionHidden,
  required,
  orientation,
  hasLabelableControl = true,
  isLabelFirst = true,
  render,
  className,
}: FormFieldProps<TValues, TName>) {
  const id = useId();
  const messageId = `${id}-message`;
  const descriptionId = `${id}-description`;
  const write = useWriteStatus();
  const validationMessage = useValidationMessage();
  const errorMessage = useActionErrorMessage();
  const refused = write.fieldErrors[name] ?? null;
  // Where focus goes when the message under the field is dismissed: the field.
  const control = useRef<HTMLElement>(null);

  return (
    <Controller<TValues, TName>
      name={name}
      render={({ field, fieldState }) => {
        // The resolver wins: it is the newer answer, and a server reason beside a
        // value already corrected is worse than none.
        const error = fieldState.error
          ? validationMessage(fieldState.error.message)
          : errorMessage(refused);
        // Only the server's gets a way out — the resolver's goes when the value does.
        const isDismissible = !fieldState.error && refused !== null;

        // `select-text` undoes the registry's checkbox-case block; `gap-0` keeps
        // the required mark against the word rather than beside it.
        const drawnLabel = (
          <FieldLabel className="gap-0 select-text" htmlFor={hasLabelableControl ? id : undefined}>
            {label}
            {required ? (
              <span aria-hidden className="text-status-failed">
                {REQUIRED_MARK}
              </span>
            ) : null}
          </FieldLabel>
        );

        return (
          <Field className={className} data-invalid={!!error} orientation={orientation}>
            {isLabelFirst ? drawnLabel : null}
            {description ? (
              <FieldDescription className={cn(isDescriptionHidden && 'sr-only')} id={descriptionId}>
                {description}
              </FieldDescription>
            ) : null}
            {render({
              field: {
                ...field,
                id,
                ref: (node: HTMLElement | null) => {
                  field.ref(node);
                  control.current = node;
                },
                'aria-invalid': !!error,
                'aria-required': !!required,
                'aria-describedby': describedBy([
                  description ? descriptionId : null,
                  error ? messageId : null,
                ]),
              },
              error,
            })}
            {isLabelFirst ? null : drawnLabel}
            <MessageRow
              id={messageId}
              onDismiss={isDismissible ? (write.dismiss ?? undefined) : undefined}
              returnFocusTo={control}
              sentences={[error]}
            />
          </Field>
        );
      }}
    />
  );
}

export type { FormFieldControl, FormFieldProps, FormFieldRenderProps };
export { FormField };
