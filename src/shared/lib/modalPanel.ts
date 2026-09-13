import { cn } from '@/shared/lib/cn';

/** How wide a modal panel grows from `sm` up. Below it every size fills the viewport minus the gutter. */
type ModalSize = 'sm' | 'md' | 'lg';

const WIDTH_BY_SIZE: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

/**
 * The classes both modal panels share, so `Modal` and `AlertModal` cannot drift
 * on width or padding. Merged after the registry's own, so `cn` drops the
 * `sm:max-w-lg` and `p-6` it ships with (`cn` knows the fluid spacing steps).
 */
function modalPanelClass(size: ModalSize, className?: string): string {
  return cn(
    'max-w-[calc(100%-var(--spacing-fluid-sm)*2)] gap-4 p-fluid-md',
    WIDTH_BY_SIZE[size],
    className,
  );
}

export type { ModalSize };
export { modalPanelClass };
