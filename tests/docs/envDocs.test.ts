import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * `.env.example` and the README are the only places a maintainer learns which
 * variables exist, so they are held in step with the schemas rather than trusted.
 */
function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

const example = read('.env.example');
const readme = read('README.md');

/** `KEY=` at the start of a line — what a copied `.env` would actually set. */
const ASSIGNED = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1] ?? '');

let schemaVariables: string[];

beforeAll(async () => {
  vi.stubEnv('PAYLOAD_SECRET', 'p'.repeat(32));
  vi.stubEnv('DATABASE_URL', 'postgres://user:pass@host/db');
  vi.stubEnv('BETTER_AUTH_SECRET', 'b'.repeat(32));

  const { bootEnvSchema, seedEnvSchema } = await import('@/constants/env');
  const { publicEnvSchema } = await import('@/constants/env.public');

  schemaVariables = [bootEnvSchema, seedEnvSchema, publicEnvSchema].flatMap((schema) =>
    Object.keys(schema.shape),
  );
});

describe('.env.example', () => {
  it('documents every variable the schemas declare', () => {
    expect(schemaVariables.filter((name) => !example.includes(name))).toEqual([]);
  });

  it('assigns nothing the schemas do not declare', () => {
    expect(ASSIGNED.filter((name) => !schemaVariables.includes(name))).toEqual([]);
  });
});

describe('the README', () => {
  it('names every variable a copied .env would have to fill in', () => {
    expect(ASSIGNED.filter((name) => !readme.includes(name))).toEqual([]);
  });
});
