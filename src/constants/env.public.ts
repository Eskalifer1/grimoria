import { z } from 'zod';

/**
 * The `NEXT_PUBLIC_*` environment, safe to import from a client component. There
 * are no entries yet — this file exists so that making a value browser-visible
 * is a deliberate edit here rather than a naming accident.
 *
 * Every variable is named literally in the object below. Next replaces a literal
 * `process.env.NEXT_PUBLIC_*` read textually at build time and ships no
 * `process.env` to the browser, so anything iterating it would parse `{}`.
 */
const publicEnvSchema = z.object({});

const PUBLIC_ENV = publicEnvSchema.parse({});

export { PUBLIC_ENV, publicEnvSchema };
