import type { ComponentProps } from 'react';

import { DestructiveButton } from '@/shared/components/DestructiveButton';
import { Button } from '@/shared/components/ui/button';

/** Color only: `destructive` paints the pair `DestructiveButton` applies; `default` is the primary fill. */
type ActionTone = 'default' | 'destructive';

interface ModalActionProps extends Omit<ComponentProps<typeof Button>, 'variant' | 'type'> {
  /** The action's color. What it does is the caller's `onClick`. */
  tone?: ActionTone;
}

/**
 * The affirmative control of a modal footer, in the tone the page asks for.
 * `Modal.Action` renders it as is; `AlertModal.Action` wraps it in the primitive
 * that closes the alert. Always `type="button"`, so a form inside the modal is
 * submitted only by its own `Form.Submit`.
 */
function ModalAction({ tone = 'default', ...props }: ModalActionProps) {
  if (tone === 'destructive') {
    return <DestructiveButton type="button" {...props} />;
  }

  return <Button type="button" {...props} />;
}

export type { ActionTone, ModalActionProps };
export { ModalAction };
