import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * `env.ts` parses at import, so the boot variables have to be in place before the
 * module is pulled in — hence the dynamic import. Every assertion below runs the
 * exported schema over a plain object instead, which is what keeps the suite from
 * depending on whatever the machine happens to have in its own environment.
 */
const COMPLETE_BOOT_ENV = {
  PAYLOAD_SECRET: 'p'.repeat(32),
  DATABASE_URL: 'postgres://user:pass@host.neon.tech/db?sslmode=require',
  BETTER_AUTH_SECRET: 'b'.repeat(32),
};

let bootEnvSchema: typeof import('@/constants/env').bootEnvSchema;
let parseSeedEnv: typeof import('@/constants/env').parseSeedEnv;

beforeAll(async () => {
  for (const [name, value] of Object.entries(COMPLETE_BOOT_ENV)) {
    vi.stubEnv(name, value);
  }

  ({ bootEnvSchema, parseSeedEnv } = await import('@/constants/env'));
});

describe('the boot schema', () => {
  it('accepts a complete set', () => {
    expect(bootEnvSchema.safeParse(COMPLETE_BOOT_ENV).success).toBe(true);
  });

  it.each(Object.keys(COMPLETE_BOOT_ENV))('rejects a missing %s, naming it', (name) => {
    const result = bootEnvSchema.safeParse({ ...COMPLETE_BOOT_ENV, [name]: undefined });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toContain(name);
  });

  it('rejects a malformed DATABASE_URL, naming it', () => {
    const result = bootEnvSchema.safeParse({ ...COMPLETE_BOOT_ENV, DATABASE_URL: 'not-a-url' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['DATABASE_URL']);
  });

  it('names every missing variable in one parse, so one restart fixes them all', () => {
    const result = bootEnvSchema.safeParse({});

    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(Object.keys(COMPLETE_BOOT_ENV)),
    );
  });

  it('defaults the variables a deployment may leave unset', () => {
    const parsed = bootEnvSchema.parse(COMPLETE_BOOT_ENV);

    expect(parsed.BETTER_AUTH_URL).toBeUndefined();
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PAYLOAD_MIGRATING).toBe(false);
    expect(parsed.DATABASE_URL_UNPOOLED).toBeUndefined();
  });

  it('reads PAYLOAD_MIGRATING as a boolean', () => {
    expect(bootEnvSchema.parse({ ...COMPLETE_BOOT_ENV, PAYLOAD_MIGRATING: 'true' })).toMatchObject({
      PAYLOAD_MIGRATING: true,
    });
  });
});

describe('parseSeedEnv', () => {
  const COMPLETE_SEED_ENV = {
    SEED_ADMIN_EMAIL: 'admin@example.com',
    SEED_ADMIN_PASSWORD: 'a-long-enough-password',
  };

  it('rejects a missing SEED_ADMIN_PASSWORD, naming it', () => {
    expect(() => parseSeedEnv({ ...COMPLETE_SEED_ENV, SEED_ADMIN_PASSWORD: undefined })).toThrow(
      /SEED_ADMIN_PASSWORD/,
    );
  });

  it('defaults SEED_ADMIN_NAME', () => {
    expect(parseSeedEnv(COMPLETE_SEED_ENV).SEED_ADMIN_NAME).toBe('Admin');
  });
});
