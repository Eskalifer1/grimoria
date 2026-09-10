'use client';

import { useTranslations } from 'next-intl';

import type { ToastMessageKey } from '@/constants/toast';

interface ToastCopyProps {
  /** Which sentence of the `toast` namespace to speak. */
  messageKey: ToastMessageKey;
}

/**
 * The body of a success toast. The counterpart to `ActionErrorToast`: a caller
 * names a key, the sentence is looked up here in the active Theme's catalog.
 */
function ToastCopy({ messageKey }: ToastCopyProps) {
  const t = useTranslations('toast');

  return t(messageKey);
}

export type { ToastCopyProps };
export { ToastCopy };
