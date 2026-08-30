'use client';

import { useTranslations } from 'next-intl';

import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_ERROR, type OptimisticErrorCode } from '@/constants/optimistic';
import type { ActionFailureDetail } from '@/shared/lib/actionResult';

// The store's own codes word themselves the same way an action's do — one
// `actionError` namespace, so a surface never asks where a failure came from.
const SHARED_CODES: readonly string[] = [
  ...Object.values(ACTION_ERROR),
  ...Object.values(OPTIMISTIC_ERROR),
];

function toSharedCode(code: string): OptimisticErrorCode {
  // A domain may answer with a code of its own; anything without shared copy reads
  // as the generic failure rather than rendering a raw code at a User.
  return SHARED_CODES.includes(code) ? (code as OptimisticErrorCode) : ACTION_ERROR.UNEXPECTED;
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

  return (error) => (error ? t(toSharedCode(error.code)) : null);
}

export { useActionErrorMessage };
