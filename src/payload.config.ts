import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Neon's pooled endpoint runs PgBouncer in transaction mode, where the `SET`
// statements schema work relies on do not survive between transactions. Schema
// work is exactly the two cases the adapter itself checks for: dev push
// (`NODE_ENV !== 'production'`) and `payload migrate` (`PAYLOAD_MIGRATING`).
// Everything else is serverless request traffic, which is what pooling is for.
const isSchemaOperation =
  process.env.NODE_ENV !== 'production' || process.env.PAYLOAD_MIGRATING === 'true';

const connectionString = isSchemaOperation
  ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ''
  : process.env.DATABASE_URL || '';

export default buildConfig({
  // None of our own yet: Payload appends a default `users` collection when a
  // config declares no auth collection, and that backs the admin until #32.
  collections: [],

  // Names what it is, and also places `importMap.js` — hence the folder name
  // under `(payload)`. ADR-0005.
  routes: {
    admin: '/cms',
  },

  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  db: postgresAdapter({
    pool: { connectionString },
  }),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
