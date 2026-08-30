'use client';

import { ACTION_ERROR } from '@/constants/action';
import { useFormField } from '@/shared/components/ui/form';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { cn } from '@/shared/lib/cn';
import { clientFailure, type OptimisticFailure } from '@/shared/lib/optimistic/entry';

/** What the schema rejecting a field reads as. The resolver's own wording never reaches a User. */
const REJECTED_HERE = clientFailure(ACTION_ERROR.INVALID_INPUT);

interface FormFieldMessageProps {
  /** The server's failure for this field, worded from the shared catalog. */
  error?: OptimisticFailure | null;

  /** This field's own wording, for a form whose rejection means more than "invalid". */
  message?: string | null;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The message under one control: what the schema rejected before the write, or
 * what the server refused after it. The schema wins — it is the newer answer.
 *
 * Both are worded from the `actionError` catalog, never from the resolver, whose
 * messages are the schema author's English (`i18n.md`).
 *
 * Mounted empty rather than conditionally (`accessibility.md`), which is why this
 * is ours and not the vendored `FormMessage`.
 */
function FormFieldMessage({ error, message, className }: FormFieldMessageProps) {
  const { error: rejected, formMessageId } = useFormField();
  const errorMessage = useActionErrorMessage();
  const text = message ?? errorMessage(rejected ? REJECTED_HERE : (error ?? null));

  return (
    <p
      className={cn(
        text ? 'wrap-anywhere text-destructive font-meta text-xs' : 'sr-only',
        className,
      )}
      id={formMessageId}
      role="alert"
    >
      {text}
    </p>
  );
}

export type { FormFieldMessageProps };
export { FormFieldMessage };
