import { defineConfig } from 'vitest/config';

/**
 * Three projects, one per test layer — which layer a piece of code belongs to
 * is `docs/testing.md`. A pure function must not pay for a fake DOM, and
 * `yarn test` must stay runnable without a database.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
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
