import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface FullPageViewProps {
  /** What the page is — usually one `EmptyState` with the page's `h1`. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The whole viewport, one thing centered in it. What a route boundary renders
 * through, and what any page with nothing but a message reaches for.
 */
function FullPageView({ children, className }: FullPageViewProps) {
  return (
    <main className={cn('flex min-h-dvh items-center justify-center p-6', className)}>
      {children}
    </main>
  );
}

export type { FullPageViewProps };
export { FullPageView };
