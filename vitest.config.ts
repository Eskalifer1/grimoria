import { resolve } from 'node:path';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Three projects, one per test layer — which layer a piece of code belongs to
 * is `docs/testing.md`. A pure function must not pay for a fake DOM, and
 * `yarn test` must stay runnable without a database.
 */
export default defineConfig({
  // `server-only` throws on import outside a React Server Component, which is the
  // point in the app and useless in a test — the empty build is what lets a test
  // import an action or a read directly.
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': resolve('node_modules/server-only/empty.js'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        // `next.config.ts` builds the app through the React Compiler, so a component
        // test that skipped it would assert against code that never ships.
        plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          setupFiles: ['tests/setup/component.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/**/*.integration.test.ts'],
        },
      },
    ],
  },
});
