import { resolveTheme } from '@/i18n/resolveTheme';
import RuleMark from '@/shared/assets/marks/rule-mark-dark-fantasy.svg';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/cn';

interface RuleProps {
  /** Merged onto the root. Where the rule sits is the caller's. */
  className?: string;
}

/**
 * The horizontal divider — under a masthead, between sections. `standard`
 * closes with a plain hairline; `dark-fantasy` sets the rule mark at the center
 * of one, at the 24 px floor `design/marks.md` sets. Decorative in both: the
 * heading below already says where a section starts.
 */
async function Rule({ className }: RuleProps) {
  const theme = await resolveTheme();

  if (theme === 'standard') {
    return <Separator className={cn('bg-border-subtle', className)} />;
  }

  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3', className)}>
      <span className="flex-1 border-border-subtle border-t" />
      <RuleMark className="w-6 flex-none" />
      <span className="flex-1 border-border-subtle border-t" />
    </div>
  );
}

export { Rule };
