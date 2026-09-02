'use client';

import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface FormActionsProps {
  /** The content to render inside the action row — submit, and whatever sits beside it. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The row a form ends with. Here rather than in each form so the order and the
 * spacing are decided once, and taking children rather than labels so a form
 * adding a control adds a child and not a prop.
 */
function FormActions({ children, className }: FormActionsProps) {
  return <div className={cn('flex items-center gap-2 self-start', className)}>{children}</div>;
}

export type { FormActionsProps };
export { FormActions };
