'use client';

import type { RefObject } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';

interface FormActionsProps {
  /** The submit button's label. */
  submitLabel: string;

  /** Whether a write is out. The button stays live — nothing is disabled (pattern B). */
  isPending?: boolean;

  /** Shows a cancel button beside submit. Omitted where there is nothing to go back to. */
  onCancel?: () => void;

  /** The cancel button's label. Defaults to the shared word. */
  cancelLabel?: string;

  /** Reaches the submit button, which is where focus returns after a dismissal. */
  submitRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * The row a form ends with. Here rather than in each form so the order, the
 * spacing and the busy state are decided once.
 */
function FormActions({
  submitLabel,
  isPending,
  onCancel,
  cancelLabel,
  submitRef,
}: FormActionsProps) {
  const t = useTranslations('form');

  return (
    <div className="flex items-center gap-2 self-start">
      <Button aria-busy={isPending} ref={submitRef} type="submit">
        {submitLabel}
      </Button>
      {onCancel ? (
        <Button onClick={onCancel} type="button" variant="ghost">
          {cancelLabel ?? t('cancel')}
        </Button>
      ) : null}
    </div>
  );
}

export type { FormActionsProps };
export { FormActions };
