'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';

interface FormCancelProps {
  /** Runs when the User backs out. */
  onCancel: () => void;

  /** The content to render inside the button. Defaults to the shared word. */
  children?: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The way out of a form. `type="button"` so it never submits, and never disabled
 * — a write in flight is the one moment a User is most likely to want out.
 */
function FormCancel({ onCancel, children, className }: FormCancelProps) {
  const t = useTranslations('form');

  return (
    <Button className={className} onClick={onCancel} type="button" variant="ghost">
      {children ?? t('cancel')}
    </Button>
  );
}

export type { FormCancelProps };
export { FormCancel };
