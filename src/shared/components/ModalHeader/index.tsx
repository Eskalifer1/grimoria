import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface ModalHeaderProps {
  /** The content to render inside the header — the title, and the description when there is one. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/** The header region of a modal panel, shared by `Modal` and `AlertModal` so the two lay out alike. */
function ModalHeader({ children, className }: ModalHeaderProps) {
  return <div className={cn('flex flex-col gap-1 text-balance', className)}>{children}</div>;
}

export type { ModalHeaderProps };
export { ModalHeader };
