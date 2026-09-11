import type { ComponentProps, ReactNode } from 'react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { cn } from '@/shared/lib/cn';

type EmptyStateHeading = 'h1' | 'h2' | 'h3';

type EmptyStateTone = 'neutral' | 'failed';

/** The description's color per tone; the title never changes color. */
const DESCRIPTION_TONE: Record<EmptyStateTone, string | undefined> = {
  neutral: undefined,
  failed: 'text-status-failed',
};

interface EmptyStateProps extends Omit<ComponentProps<typeof Empty>, 'title' | 'children'> {
  /** Drawn above the title. Decorative, so it carries no accessible name. */
  illustration?: ReactNode;

  /** What happened, or what is missing, in a few words. */
  title: string;

  /** Which heading the title is. A page owns `h1`; a region inside one takes `h2` or `h3`. */
  heading?: EmptyStateHeading;

  /** The sentence under the title: what it means, and what to do about it. */
  description?: string;

  /** Colors the description. `failed` for a surface blocked by an error. */
  tone?: EmptyStateTone;

  /** A way forward, rendered under the description. Omitted where there is none. */
  action?: ReactNode;

  /** A quiet line under the action — a support reference, never a stack trace. */
  reference?: ReactNode;
}

/**
 * The one shape behind every "nothing here" surface — an empty list, a 404, a
 * thrown page, a write that is out or failed. It sizes to its content and
 * positions nothing: a page centers it with `FullPageView`, a card drops it in
 * place, `BlockingView` lays it over the surface it replaces.
 */
function EmptyState({
  illustration,
  title,
  heading: Heading = 'h2',
  description,
  tone = 'neutral',
  action,
  reference,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Empty className={cn('flex-none', className)} {...props}>
      <EmptyHeader>
        {illustration ? <EmptyMedia>{illustration}</EmptyMedia> : null}
        <EmptyTitle asChild className="font-display text-text-title">
          <Heading>{title}</Heading>
        </EmptyTitle>
        {description ? (
          <EmptyDescription className={DESCRIPTION_TONE[tone]}>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
      {reference ? (
        <p className="font-code text-xs tracking-mono text-text-muted">{reference}</p>
      ) : null}
    </Empty>
  );
}

export type { EmptyStateHeading, EmptyStateProps, EmptyStateTone };
export { EmptyState };
