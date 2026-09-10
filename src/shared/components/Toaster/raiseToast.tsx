'use client';

import { toast } from 'sonner';

import {
  TOAST_FAILURE_DURATION_MS,
  TOAST_SUCCESS_DURATION_MS,
  type ToastMessageKey,
} from '@/constants/toast';
import { ActionErrorToast } from '@/shared/components/Toaster/ActionErrorToast';
import { ToastCopy } from '@/shared/components/Toaster/ToastCopy';

/**
 * Raises the failure toast for one action error code. **The id is the code**, so
 * a User who has lost the network sees one sentence rather than a stack of the
 * same one. Called by `runAction` and by nothing else.
 */
function raiseActionErrorToast(code: string): void {
  toast.error(<ActionErrorToast code={code} />, {
    id: code,
    duration: TOAST_FAILURE_DURATION_MS,
  });
}

/**
 * Raises the confirmation toast for one `toast` copy key. The id is the key, on
 * the same reasoning as above — a write repeated states its outcome once.
 */
function raiseSuccessToast(messageKey: ToastMessageKey): void {
  toast.success(<ToastCopy messageKey={messageKey} />, {
    id: messageKey,
    duration: TOAST_SUCCESS_DURATION_MS,
  });
}

export { raiseActionErrorToast, raiseSuccessToast };
