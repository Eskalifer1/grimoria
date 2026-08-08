import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts, so a caller's `className`
 * overrides a component's own utility instead of both surviving.
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { cn };
