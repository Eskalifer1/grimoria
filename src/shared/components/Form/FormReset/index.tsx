'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/shared/components/ui/button';
import { useWriteStatus } from '@/shared/hooks/useWriteStatus';

interface FormResetProps {
  /** The content to render inside the button. Defaults to the shared word. */
  children?: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * Puts the form back to what the server last confirmed — every draft dropped,
 * every refusal cleared, the write's own failure dismissed with them.
 *
 * **Here rather than `form.reset()` at the call site.** The hook's `resetOptions`
 * keep dirty values and errors, because a change to `values` resets the form too
 * and neither should survive that; a hand-rolled reset inherits them and clears
 * nothing. This is the one place those options are turned back off.
 */
function FormReset({ children, className }: FormResetProps) {
  const t = useTranslations('form');
  const form = useFormContext();
  const { dismiss } = useWriteStatus();

  function handleReset() {
    form.reset(undefined, { keepDirtyValues: false, keepErrors: false });
    dismiss?.();
  }

  return (
    <Button className={className} onClick={handleReset} type="button" variant="ghost">
      {children ?? t('reset')}
    </Button>
  );
}

export type { FormResetProps };
export { FormReset };
