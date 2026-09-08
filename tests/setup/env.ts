/**
 * Placeholder boot variables, installed before any test module is imported.
 * `src/constants/env.ts` parses at import and throws on a missing variable — the
 * point of the module — so a test reaching `@payload-config`, even three hops
 * away, would fail on the environment rather than on its subject. No test
 * touches a database (`docs/testing.md`), so nothing here has to be real.
 */
const PLACEHOLDER_BOOT_ENV = {
  PAYLOAD_SECRET: 'test-payload-secret-000000000000000000',
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  BETTER_AUTH_SECRET: 'test-better-auth-secret-000000000000',
};

for (const [name, value] of Object.entries(PLACEHOLDER_BOOT_ENV)) {
  process.env[name] ??= value;
}
