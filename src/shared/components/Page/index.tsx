import type { ReactNode } from 'react';

import { OfflineIndicator } from '@/shared/components/OfflineIndicator';
import { Rule } from '@/shared/components/Rule';
import { cn } from '@/shared/lib/cn';

interface PageProps {
  /** The page's one `h1`, in the display face. */
  title: string;

  /** A count or state line under the title, in the meta face. Absent, it takes no space. */
  status?: string;

  /** Rendered opposite the title. The box keeps its width whether or not it is filled (#2). */
  aside?: ReactNode;

  /** Rendered after the content, at the foot of the viewport when the content is short. */
  bottomContent?: ReactNode;

  /** The content to render inside the page, under the masthead. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

/**
 * The shell every routed page renders through: the offline sign, the masthead
 * `docs/features/site-layout.md` §Content area promises, the content, and a
 * slot at the foot. A boundary page takes `FullPageView` instead. No max
 * width — the shell around it (#75) knows how much room the sidebar leaves.
 */
function Page({ title, status, aside, bottomContent, children, className }: PageProps) {
  return (
    <main className={cn('flex min-h-svh flex-col gap-fluid-md p-fluid-md-lg', className)}>
      <OfflineIndicator />
      <header className="flex flex-col gap-fluid-sm">
        <div className="flex items-start justify-between gap-fluid-sm">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl text-text-title">{title}</h1>
            {status ? (
              <p className="font-meta text-text-muted text-xs tracking-meta">{status}</p>
            ) : null}
          </div>
          <div className="flex min-h-11 min-w-11 flex-none justify-end">{aside}</div>
        </div>
        <Rule />
      </header>
      {children}
      {bottomContent ? <div className="mt-auto">{bottomContent}</div> : null}
    </main>
  );
}

export type { PageProps };
export { Page };
