import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The fluid spacing steps `tokens.css` adds beside the numeric scale. Unknown to
 * tailwind-merge, so `p-fluid-md` and `p-6` would otherwise both survive a merge.
 */
const SPACING_STEPS = [
  'fluid-3xs',
  'fluid-2xs',
  'fluid-xs',
  'fluid-sm',
  'fluid-md',
  'fluid-lg',
  'fluid-xl',
  'fluid-2xl',
  'fluid-3xl',
  'fluid-sm-lg',
  'fluid-md-lg',
  'fluid-lg-xl',
  'fluid-xl-2xl',
];

const twMerge = extendTailwindMerge({ extend: { theme: { spacing: SPACING_STEPS } } });

/**
 * Joins class names and resolves Tailwind conflicts, so a caller's `className`
 * overrides a component's own utility instead of both surviving.
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { cn };
