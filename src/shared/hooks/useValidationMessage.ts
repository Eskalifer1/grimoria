'use client';

import { useTranslations } from 'next-intl';

import { ACTION_ERROR } from '@/constants/action';
import { VALIDATION_ERROR } from '@/constants/validation';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { assertNever } from '@/shared/lib/assertNever';
import { clientFailure } from '@/shared/lib/optimistic/entry';
import { parseValidationMessage } from '@/shared/lib/validationMessage';

/**
 * Words a resolver's message in the active Theme, and `undefined` as `null` so a
 * field can render whatever its state holds.
 *
 * A schema carries a catalog key rather than English (`validationMessage`); one
 * still carrying English is worded as the generic refusal instead, because the
 * schema author's sentence is a log line and not copy (`i18n.md`).
 */
function useValidationMessage(): (message: string | undefined) => string | null {
  const t = useTranslations('validation');
  const errorMessage = useActionErrorMessage();

  return (message) => {
    if (!message) {
      return null;
    }

    const rejected = parseValidationMessage(message);

    if (!rejected) {
      return errorMessage(clientFailure(ACTION_ERROR.INVALID_INPUT));
    }

    switch (rejected.code) {
      case VALIDATION_ERROR.REQUIRED:
        return t('required');
      case VALIDATION_ERROR.TOO_SHORT:
        return t('tooShort', { limit: rejected.limit });
      case VALIDATION_ERROR.TOO_LONG:
        return t('tooLong', { limit: rejected.limit });
      default:
        return assertNever(rejected.code);
    }
  };
}

export { useValidationMessage };
