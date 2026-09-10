import { describe, expect, it } from 'vitest';

import { THEMES } from '@/constants/theme';

import { importSpecifiers, listSourceFiles, readSource, toRepoPath } from '../fixtures/sourceTree';

const FRONTEND_ROOT = 'src/app/(frontend)/';

/** The one segment the visible URL never shows, so only the proxy may write one. */
const THEME_SEGMENT_WRITERS = ['src/proxy.ts'];

function frontendFiles(): string[] {
  return listSourceFiles().filter((absolutePath) =>
    toRepoPath(absolutePath).startsWith(FRONTEND_ROOT),
  );
}

describe('the hidden Theme segment', () => {
  it('holds every (frontend) route file under [theme]/[locale]', () => {
    const outside = frontendFiles()
      .map(toRepoPath)
      .filter((repoPath) => !repoPath.startsWith(`${FRONTEND_ROOT}[theme]/[locale]/`));

    expect(outside).toEqual([]);
  });

  it('is written into a path by the proxy and by nothing else', () => {
    const offenders = listSourceFiles()
      .filter((absolutePath) => !THEME_SEGMENT_WRITERS.includes(toRepoPath(absolutePath)))
      .filter((absolutePath) =>
        THEMES.some((theme) => readSource(absolutePath).includes(`/${theme}/`)),
      )
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });

  it('leaves the head to a static metadata object, so both Themes emit the same one', () => {
    const offenders = frontendFiles()
      .filter((absolutePath) => readSource(absolutePath).includes('generateMetadata'))
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });
});

describe('the reads that would opt a page out of static rendering', () => {
  it('leaves resolveTheme reading neither a cookie nor a session', () => {
    const source = readSource(
      listSourceFiles().find(
        (absolutePath) => toRepoPath(absolutePath) === 'src/i18n/resolveTheme.ts',
      ) as string,
    );

    expect(source).not.toContain('next/headers');
    expect(source).not.toContain('payload');
    expect(source).not.toContain('THEME_COOKIE_NAME');
  });

  it('keeps getCurrentUser out of every (frontend) layout', () => {
    const offenders = frontendFiles()
      .filter((absolutePath) =>
        importSpecifiers(absolutePath).some((specifier) => specifier.includes('getCurrentUser')),
      )
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });

  it('leaves the Theme cookie to the proxy, which is the only reader', () => {
    const offenders = listSourceFiles()
      .filter((absolutePath) => !toRepoPath(absolutePath).startsWith('src/constants/'))
      .filter((absolutePath) => !toRepoPath(absolutePath).startsWith('src/auth/'))
      .filter((absolutePath) => readSource(absolutePath).includes('THEME_COOKIE_NAME'))
      .map(toRepoPath);

    expect(offenders).toEqual(THEME_SEGMENT_WRITERS);
  });
});
