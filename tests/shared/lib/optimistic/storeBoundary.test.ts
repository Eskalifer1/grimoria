import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  importSpecifiers,
  listSourceFiles,
  resolveSpecifier,
  toRepoPath,
} from '../../../fixtures/sourceTree';

const STORE = 'src/shared/lib/optimistic/store.ts';

/**
 * The store is written through a descriptor, and the hooks reach it through the
 * context rather than through the module — so naming the singleton is two files:
 * the runner's default, and the context's.
 */
const ALLOWED_IMPORTERS = [
  'src/shared/lib/optimistic/run.ts',
  'src/shared/hooks/useOptimisticStore.ts',
];

function importersOf(target: string): string[] {
  return listSourceFiles()
    .filter((file) =>
      importSpecifiers(file).some((specifier) => {
        const resolved = resolveSpecifier(specifier, file);

        return resolved !== null && toRepoPath(resolved) === target;
      }),
    )
    .map(toRepoPath);
}

describe('the store is reachable through a descriptor only', () => {
  it('is imported by the hooks and the runner, and by nothing else', () => {
    expect(importersOf(STORE).sort()).toEqual([...ALLOWED_IMPORTERS].sort());
  });

  it('is banned from the screen layers by the linter, not by review', () => {
    const raw = readFileSync(resolve(import.meta.dirname, '../../../../biome.json'), 'utf8');
    const config = z
      .object({ overrides: z.array(z.looseObject({ includes: z.array(z.string()) })) })
      .parse(JSON.parse(raw));

    const banned = config.overrides
      .filter((override) => JSON.stringify(override).includes('@/shared/lib/optimistic/store'))
      .flatMap((override) => override.includes);

    expect(banned).toEqual(
      expect.arrayContaining(['src/app/**', 'src/views/**', 'src/features/**', 'src/entities/**']),
    );
  });
});
