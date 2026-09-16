import type { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/cn';

interface TooltipTextProps {
  /** What the tooltip says. Plain text: a tooltip holds nothing focusable (`accessibility.md`). */
  tooltip: ReactNode;

  /** The text drawn inline; it stays the accessible name, the tooltip only describes it. */
  children: ReactNode;

  /** Additional classes, merged onto the inline text. */
  className?: string;
}

/**
 * Inline text with a description on hover and focus — a truncated title, a
 * date shown as a relative word. Focusable, so a keyboard reaches the tooltip.
 */
function TooltipText({ tooltip, children, className }: TooltipTextProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a tooltip trigger must be focusable (APG), and text is not a button */}
        <span className={cn('rounded-sm', className)} tabIndex={0}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export type { TooltipTextProps };
export { TooltipText };
