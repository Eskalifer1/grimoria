'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

interface DestructiveButtonConfirm {
  /** What the dialog asks the User to confirm. */
  title: ReactNode;

  /** Detail under the title. */
  description?: ReactNode;

  /** The confirming control's label. Defaults to the shared word. */
  confirmLabel?: ReactNode;

  /** The cancelling control's label. Defaults to the shared word. */
  cancelLabel?: ReactNode;
}

type DestructiveButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant' | 'onClick'> &
  (
    | { confirm?: undefined; onClick?: React.ComponentProps<typeof Button>['onClick'] }
    | { confirm: DestructiveButtonConfirm; onClick?: () => void; type?: 'button' }
  );

/**
 * The delete confirmation. `ui/button.tsx` sets its destructive variant with a
 * literal `text-white` and opacity hovers, none of which survive a token-only
 * palette — so the pair is reapplied here rather than in `ui/button.tsx`, which
 * every variant shares (`layers.md`). Merged last, so `cn` drops what it replaces.
 *
 * With `confirm`, the click opens a `ConfirmDialog` instead of running `onClick`
 * directly — `onClick` then runs only once the User confirms, so it takes no
 * event (there is none by the time it fires).
 */
function DestructiveButton({
  className,
  confirm,
  onClick,
  type,
  ...props
}: DestructiveButtonProps) {
  const [open, setOpen] = useState(false);

  const button = (
    <Button
      variant="destructive"
      className={cn(
        'bg-action-destructive-bg text-action-destructive-fg',
        'hover:bg-action-destructive-bg-hover active:bg-action-destructive-bg-pressed',
        'disabled:bg-action-destructive-bg-disabled disabled:text-action-destructive-fg-disabled',
        className,
      )}
      onClick={confirm ? () => setOpen(true) : onClick}
      // A form around it would otherwise submit past the confirmation.
      type={confirm ? 'button' : type}
      {...props}
    />
  );

  if (!confirm) {
    return button;
  }

  return (
    <>
      {button}
      <ConfirmDialog
        cancelLabel={confirm.cancelLabel}
        confirmLabel={confirm.confirmLabel}
        description={confirm.description}
        onConfirm={() => onClick?.()}
        onOpenChange={setOpen}
        open={open}
        title={confirm.title}
        tone="destructive"
      />
    </>
  );
}

export type { DestructiveButtonConfirm, DestructiveButtonProps };
export { DestructiveButton };
