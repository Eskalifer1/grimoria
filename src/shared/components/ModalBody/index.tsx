import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface ModalBodyProps {
  /** The content to render inside the body — the content — the question, or the form. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/** The body region of a modal panel, shared by `Modal` and `AlertModal` so the two lay out alike. */
function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('min-w-0 wrap-anywhere', className)}>{children}</div>;
}

export type { ModalBodyProps };
export { ModalBody };
