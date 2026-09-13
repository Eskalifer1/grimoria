import { describe, expect, it } from 'vitest';

import { cn } from '@/shared/lib/cn';

describe('cn', () => {
  it('lets a named spacing step replace a numeric one', () => {
    expect(cn('p-6', 'p-fluid-md')).toBe('p-fluid-md');
    expect(cn('gap-4 px-2', 'gap-fluid-lg', 'px-fluid-sm-lg')).toBe('gap-fluid-lg px-fluid-sm-lg');
  });

  it('lets a caller override a named step', () => {
    expect(cn('p-fluid-md', 'p-fluid-lg')).toBe('p-fluid-lg');
  });
});
