'use client';

import { useTranslations } from 'next-intl';

import { ACTION_ERROR, type ActionErrorCode } from '@/constants/action';
import type { ActionFailureDetail } from '@/shared/lib/actionResult';

const SHARED_CODES: readonly string[] = Object.values(ACTION_ERROR);

function toSharedCode(code: string): ActionErrorCode {
  // A domain may answer with a code of its own; anything without shared copy reads
  // as the generic failure rather than rendering a raw code at a User.
  return SHARED_CODES.includes(code) ? (code as ActionErrorCode) : ACTION_ERROR.UNEXPECTED;
}

/**
 * Turns the failure of any action into a sentence in the active Theme's wording,
 * and `null` into `null`, so a surface can render the result of a call without
 * knowing which codes it can answer with.
 *
 * A code is the message key, so a code added without copy fails `tsc` here rather
 * than reaching a User raw. A surface needing its own wording for one code
 * branches on `error.code` before calling this.
 */
function useActionErrorMessage(): (error: ActionFailureDetail<string> | null) => string | null {
  const t = useTranslations('actionError');

  return (error) => (error === null ? null : t(toSharedCode(error.code)));
}

export { useActionErrorMessage };
