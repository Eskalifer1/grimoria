'use client';

import type { ReactNode, Ref } from 'react';

import { useTranslations } from 'next-intl';

import { SUBMIT_LOCK } from '@/constants/form';
import { Button } from '@/shared/components/ui/button';
import { useWriteStatus } from '@/shared/hooks/useWriteStatus';
import { cn } from '@/shared/lib/cn';

interface FormSubmitProps {
  /** The content to render inside the button. Defaults to the shared word. */
  children?: ReactNode;

  /** Forwarded to the button, which is where focus returns after a dismissal. */
  ref?: Ref<HTMLButtonElement>;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The button that sends the form. It refuses a second submit only where the
 * answer cannot be guessed and the write must not be repeated — an optimistic
 * form has its answer on screen already, and refuses nothing.
 *
 * **`aria-disabled`, never `disabled`.** A browser blurs a control the moment it
 * is disabled, which drops a keyboard User to the document body for the length of
 * the write and never brings them back (WCAG 2.2 AA, 2.4.3). The submit that must
 * not be repeated is refused by `Form.Root`, which also catches the Enter key no
 * button ever sees.
 */
function FormSubmit({ children, ref, className }: FormSubmitProps) {
  const t = useTranslations('form');
  const write = useWriteStatus();

  return (
    <Button
      aria-busy={write.isPending}
      aria-disabled={write.submitLock === SUBMIT_LOCK.SUBMIT && write.isPending}
      className={cn('aria-disabled:opacity-70', className)}
      ref={ref}
      type="submit"
    >
      {children ?? t('save')}
    </Button>
  );
}

export type { FormSubmitProps };
export { FormSubmit };
