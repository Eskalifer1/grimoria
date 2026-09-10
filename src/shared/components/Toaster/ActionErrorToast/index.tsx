'use client';

import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';

interface ActionErrorToastProps {
  /** The failure code, worded here rather than by the caller so a Theme switch redraws it. */
  code: string;
}

/**
 * The body of a failure toast. It exists so `runAction` can raise a toast
 * carrying a code and nothing else — the sentence is resolved at render, where
 * `next-intl` is reachable and the active Theme is known.
 */
function ActionErrorToast({ code }: ActionErrorToastProps) {
  const errorMessage = useActionErrorMessage();

  return errorMessage({ code, fields: null });
}

export type { ActionErrorToastProps };
export { ActionErrorToast };
