'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';

interface DismissErrorButtonProps {
  /** The message this button throws away. It is what tells a screen reader which one. */
  describedBy: string;

  /** Throws the attempt away — the message and the value it belongs to. */
  onDismiss: () => void;
}

/**
 * Described by the message rather than named after it: a list of rows would
 * otherwise offer one button called "Dismiss" per row with nothing telling them
 * apart (WCAG 2.2 AA, 4.1.2).
 *
 * The cross is decoration; the name is the `sr-only` word beside it.
 */
function DismissErrorButton({ describedBy, onDismiss }: DismissErrorButtonProps) {
  const t = useTranslations('optimistic');

  return (
    <Button
      aria-describedby={describedBy}
      className="text-status-failed hover:text-status-failed"
      onClick={onDismiss}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      <XIcon aria-hidden="true" />
      <span className="sr-only">{t('dismiss')}</span>
    </Button>
  );
}

export type { DismissErrorButtonProps };
export { DismissErrorButton };
