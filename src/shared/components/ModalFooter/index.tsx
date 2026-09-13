import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface ModalFooterProps {
  /** The content to render inside the footer — the controls, or a Form.Footer where a form owns them. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/** The footer region of a modal panel, shared by `Modal` and `AlertModal` so the two lay out alike. */
function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}>
      {children}
    </div>
  );
}

export type { ModalFooterProps };
export { ModalFooter };
