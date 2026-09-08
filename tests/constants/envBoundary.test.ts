import { describe, expect, it } from 'vitest';

import { importSpecifiers, listSourceFiles, readSource, toRepoPath } from '../fixtures/sourceTree';

/** The only two files allowed to read the environment raw. */
const ENV_MODULES = ['src/constants/env.ts', 'src/constants/env.public.ts'];

/** The raw module carries no `server-only`, so these read it through `env.server`. */
const RAW_ENV_MODULE = '@/constants/env';

const APP_LAYERS = ['src/app/', 'src/views/', 'src/features/', 'src/entities/', 'src/shared/'];

describe('the environment boundary', () => {
  it('is the only place under src/ that touches process.env', () => {
    const offenders = listSourceFiles()
      .filter((absolutePath) => !ENV_MODULES.includes(toRepoPath(absolutePath)))
      .filter((absolutePath) => readSource(absolutePath).includes('process.env'))
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });

  it('keeps the raw env module out of every app layer, which reads env.server instead', () => {
    const offenders = listSourceFiles()
      .filter((absolutePath) =>
        APP_LAYERS.some((layer) => toRepoPath(absolutePath).startsWith(layer)),
      )
      .filter((absolutePath) => importSpecifiers(absolutePath).includes(RAW_ENV_MODULE))
      .map(toRepoPath);

    expect(offenders).toEqual([]);
  });
});
