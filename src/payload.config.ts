import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
