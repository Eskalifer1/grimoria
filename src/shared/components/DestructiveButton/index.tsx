import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

type DestructiveButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'>;

/**
 * The delete confirmation. `ui/button.tsx` sets its destructive variant with a
 * literal `text-white` and opacity hovers, none of which survive a token-only
 * palette — so the pair is reapplied here rather than in `ui/button.tsx`, which
 * every variant shares (`layers.md`). Merged last, so `cn` drops what it replaces.
 */
function DestructiveButton({ className, ...props }: DestructiveButtonProps) {
  return (
    <Button
      variant="destructive"
      className={cn(
        'bg-action-destructive-bg text-action-destructive-fg',
        'hover:bg-action-destructive-bg-hover active:bg-action-destructive-bg-pressed',
        'disabled:bg-action-destructive-bg-disabled disabled:text-action-destructive-fg-disabled',
        className,
      )}
      {...props}
    />
  );
}

export type { DestructiveButtonProps };
export { DestructiveButton };
