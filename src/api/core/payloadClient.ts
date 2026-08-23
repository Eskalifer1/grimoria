import 'server-only';

import { cache } from 'react';

import config from '@payload-config';
import type { Payload } from 'payload';
import { getPayload } from 'payload';

/**
 * The Payload instance, in-process, one per request. `cache()`d so a layout, its
 * page and any action they trigger share a single initialization.
 *
 * Every module under `src/api/` gets its client here rather than calling
 * `getPayload` itself, which is what keeps the config import in one file.
 */
const getPayloadClient = cache(async (): Promise<Payload> => getPayload({ config }));

export { getPayloadClient };
