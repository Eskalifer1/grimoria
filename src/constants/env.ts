import { z } from 'zod';

/**
 * The boot environment, parsed once at import. Read this file from
 * `src/payload.config.ts` and `scripts/` only — every other server module goes
 * through `env.server.ts`, and the browser through `env.public.ts`.
 *
 * It carries no `server-only`: `payload run` and `payload migrate` load the
 * Payload config in plain Node, where that package resolves to its throwing
 * build and takes the CLI down with it.
 */

/** Long enough that a token signed with it is not worth attacking. */
const SECRET_MIN_LENGTH = 32;

const bootEnvSchema = z.object({
  PAYLOAD_SECRET: z.string().min(SECRET_MIN_LENGTH),
  DATABASE_URL: z.url(),
  DATABASE_URL_UNPOOLED: z.url().optional(),
  // Nothing in our code reads this — Better Auth takes it from the environment
  // itself. It is required here so an unset secret fails with its own name at
  // boot rather than somewhere inside Better Auth in production.
  BETTER_AUTH_SECRET: z.string().min(SECRET_MIN_LENGTH),
  // Left optional on purpose: unset, Better Auth falls back to the request's own
  // origin, which is right in production. A default here would pin a deployment
  // that forgot the variable to localhost, silently and without an error.
  BETTER_AUTH_URL: z.url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PAYLOAD_MIGRATING: z.stringbool().default(false),
});

const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(1),
  SEED_ADMIN_NAME: z.string().min(1).default('Admin'),
});

type BootEnv = z.infer<typeof bootEnvSchema>;

type SeedEnv = z.infer<typeof seedEnvSchema>;

/** One throw listing every bad variable, so one pass fixes them all. */
function parse<TSchema extends z.ZodType>(schema: TSchema, source: unknown): z.infer<TSchema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

const bootEnv: BootEnv = parse(bootEnvSchema, process.env);

// Neon's pooled endpoint runs PgBouncer in transaction mode, where the `SET`
// statements schema work relies on do not survive between transactions. Schema
// work is exactly the two cases the adapter itself checks for: dev push
// (`NODE_ENV !== 'production'`) and `payload migrate` (`PAYLOAD_MIGRATING`).
const IS_SCHEMA_OPERATION = bootEnv.NODE_ENV !== 'production' || bootEnv.PAYLOAD_MIGRATING;

// Neon hands out `sslmode=require`, which `pg` treats as `verify-full` today and
// warns about on every boot, because `pg@9` will downgrade it to libpq's weaker
// meaning. Asking for `verify-full` outright keeps the behavior we already have
// — Neon's certificates are publicly trusted — and drops the warning.
const DATABASE_URL = (
  IS_SCHEMA_OPERATION
    ? (bootEnv.DATABASE_URL_UNPOOLED ?? bootEnv.DATABASE_URL)
    : bootEnv.DATABASE_URL
).replace('sslmode=require', 'sslmode=verify-full');

const { BETTER_AUTH_URL, NODE_ENV, PAYLOAD_SECRET } = bootEnv;

// Open Graph needs an absolute URL and cannot ask the request for one, so this
// is the one place a localhost fallback is correct rather than a hidden pin.
const METADATA_BASE_URL = BETTER_AUTH_URL ?? 'http://localhost:3000';

/**
 * The `SEED_ADMIN_*` variables, validated when `yarn seed` runs rather than at
 * boot — the app has no use for them. Throws naming each bad variable.
 */
function parseSeedEnv(source: unknown = process.env): SeedEnv {
  return parse(seedEnvSchema, source);
}

export {
  BETTER_AUTH_URL,
  bootEnvSchema,
  DATABASE_URL,
  IS_SCHEMA_OPERATION,
  METADATA_BASE_URL,
  NODE_ENV,
  PAYLOAD_SECRET,
  parseSeedEnv,
  seedEnvSchema,
};
