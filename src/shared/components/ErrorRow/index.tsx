'use client';

import { MessageRow, type MessageRowProps } from '@/shared/components/MessageRow';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import type { ActionFailureDetail } from '@/shared/lib/actionResult';

interface ErrorRowProps extends Omit<MessageRowProps, 'sentences'> {
  /** Every failure recorded against the element. Two attempts that failed the same way read as one. */
  errors: readonly ActionFailureDetail<string>[];
}

/**
 * The default message row: hand it failures and it words them in the active
 * Theme. Errors are never delayed the way flight is — a failure the User has
 * already moved past is the one thing they must still be told about.
 *
 * A caller holding a sentence from somewhere else — a form field, whose refusal
 * may have come from the resolver rather than the server — draws `MessageRow`
 * instead and words it itself.
 *
 * See docs/features/data-access/pattern-b.md.
 */
function ErrorRow({ errors, ...rest }: ErrorRowProps) {
  const errorMessage = useActionErrorMessage();

  return <MessageRow {...rest} sentences={errors.map(errorMessage)} />;
}

export type { ErrorRowProps };
export { ErrorRow };
