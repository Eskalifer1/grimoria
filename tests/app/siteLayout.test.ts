import { describe, expect, it, vi } from 'vitest';

import SiteLayout from '@/app/(frontend)/[theme]/[locale]/(site)/layout';

import { listSourceFiles, readSource, toRepoPath } from '../fixtures/sourceTree';

const NOT_FOUND = new Error('NOT_FOUND_SENTINEL');

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw NOT_FOUND;
  }),
}));

function renderLayout(theme: string, locale: string) {
  return SiteLayout({
    params: Promise.resolve({ theme, locale }),
    children: null,
  } as never);
}

describe('SiteLayout', () => {
  it('sends an unknown Theme segment to the group 404', async () => {
    await expect(renderLayout('nope', 'en')).rejects.toThrow(NOT_FOUND);
  });

  it('sends an unknown locale segment to the group 404', async () => {
    await expect(renderLayout('standard', 'xx')).rejects.toThrow(NOT_FOUND);
  });
});

describe('the App Router opt-outs Cache Components forbid', () => {
  it('leaves no dynamicParams, dynamic or revalidate export under src/app/', () => {
    const offenders = listSourceFiles()
      .filter((absolutePath) => toRepoPath(absolutePath).startsWith('src/app/'))
      .filter((absolutePath) =>
        /export\s+const\s+(dynamicParams|dynamic|revalidate)\b/.test(readSource(absolutePath)),
      )
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });
});
