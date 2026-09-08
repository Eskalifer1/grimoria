import 'server-only';

import {
  BETTER_AUTH_URL,
  DATABASE_URL,
  IS_SCHEMA_OPERATION,
  METADATA_BASE_URL,
  NODE_ENV,
  PAYLOAD_SECRET,
} from './env';

/**
 * The boot environment for the app itself. `server-only` is the whole point:
 * pulling a secret into a client graph fails the build here rather than shipping
 * it. `src/payload.config.ts` and `scripts/` import `./env` instead, because the
 * Payload CLI loads them outside a bundler where `server-only` throws.
 */

export {
  BETTER_AUTH_URL,
  DATABASE_URL,
  IS_SCHEMA_OPERATION,
  METADATA_BASE_URL,
  NODE_ENV,
  PAYLOAD_SECRET,
};
