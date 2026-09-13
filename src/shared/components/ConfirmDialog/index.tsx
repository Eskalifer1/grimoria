'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { AlertModal } from '@/shared/components/AlertModal';
import type { ActionTone } from '@/shared/components/ModalAction';

interface ConfirmDialogProps {
  /** Whether the dialog is shown. Controlled: the page owns the flag. */
  open: boolean;

  /** Called with `false` on Escape, cancel, or a confirmed action. */
  onOpenChange: (open: boolean) => void;

  /** What the dialog asks the User to confirm. */
  title: ReactNode;

  /** Detail under the title. */
  description?: ReactNode;

  /** The confirming control's label. Defaults to the shared word. */
  confirmLabel?: ReactNode;

  /** The cancelling control's label. Defaults to the shared word. */
  cancelLabel?: ReactNode;

  /** Runs when the User confirms. The dialog then closes on its own. */
  onConfirm: () => void;

  /** The confirming control's color. */
  tone?: ActionTone;
}

/**
 * The one confirm preset over `AlertModal`: a title, an optional description,
 * and the two controls. A failing `onConfirm` is reported through the
 * optimistic rollback and toast the form layer already runs — this dialog
 * always closes on confirm.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone,
}: ConfirmDialogProps) {
  const t = useTranslations('modal');

  // `AlertModal.Action` closes on its own, so the parent hears `false` once.
  function handleConfirm() {
    onConfirm();
  }

  return (
    <AlertModal onOpenChange={onOpenChange} open={open}>
      <AlertModal.Header>
        <AlertModal.Title>{title}</AlertModal.Title>
        {description ? <AlertModal.Description>{description}</AlertModal.Description> : null}
      </AlertModal.Header>
      <AlertModal.Footer>
        <AlertModal.Cancel>{cancelLabel ?? t('cancel')}</AlertModal.Cancel>
        <AlertModal.Action onClick={handleConfirm} tone={tone}>
          {confirmLabel ?? t('confirm')}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
}

export type { ConfirmDialogProps };
export { ConfirmDialog };
