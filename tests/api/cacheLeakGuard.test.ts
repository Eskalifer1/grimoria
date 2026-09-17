import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  importSpecifiers,
  listSourceFiles,
  readSource,
  SOURCE_ROOT,
  toRepoPath,
} from '../fixtures/sourceTree';

/** Every hand-written file under `src/api/`. */
function apiFiles(): string[] {
  return listSourceFiles(join(SOURCE_ROOT, 'api'));
}

/**
 * A shared cache directive — the one that must never see a session. Matched
 * per directive, so a private read beside a shared one does not excuse it.
 */
function hasSharedCacheDirective(source: string): boolean {
  return /'use cache(: remote)?'/.test(source);
}

describe('cache leak guard', () => {
  it('never lets a shared-cache file under src/api/ import the session module', () => {
    const offenders = apiFiles()
      .filter((file) => hasSharedCacheDirective(readSource(file)))
      .filter((file) => importSpecifiers(file).some((specifier) => specifier.includes('session')))
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });

  it('carries the one allowed pairing: getCurrentUser reads through a private cache', () => {
    const source = readSource(join(SOURCE_ROOT, 'api/user/getCurrentUser.ts'));

    expect(source).toContain("'use cache: private'");
  });
});
