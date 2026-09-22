import type { ReactElement } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { HomePage } from '@/views/HomePage';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));
vi.mock('@/i18n/resolveTheme', () => ({ resolveTheme: vi.fn().mockResolvedValue('standard') }));
vi.mock('@/constants/env.public', () => ({ NODE_ENVIRONMENT: 'development' }));

/** Walks a rendered tree depth-first and returns the first element of the given type. */
function find(node: unknown, type: unknown): ReactElement | undefined {
  if (!node || typeof node !== 'object') {
    return undefined;
  }

  const element = node as ReactElement;

  if (element.type === type) {
    return element;
  }

  const value = (element.props as { children?: unknown } | undefined)?.children;
  const candidates = Array.isArray(value) ? value : [value];

  for (const candidate of candidates) {
    const match = find(candidate, type);

    if (match) {
      return match;
    }
  }

  return undefined;
}

describe('HomePage', () => {
  it('mounts the ThemeToggle outside production, with the resolved Theme', async () => {
    const page = await HomePage();
    const toggle = find(page, ThemeToggle);

    expect(toggle?.props).toEqual({ theme: 'standard' });
  });
});
