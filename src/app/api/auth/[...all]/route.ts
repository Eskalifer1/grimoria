import config from '@payload-config';
import { toNextJsHandler } from 'better-auth/next-js';
import { getPayloadAuth } from 'payload-auth/better-auth/plugin';

// Every Better Auth flow — sign-up, sign-in, sign-out, session refresh, and
// the OAuth callbacks once providers exist (#1) — enters here. It sits outside
// `(payload)` because Payload's own catch-all under `/api` would otherwise
// swallow it; a static segment still wins over `[...slug]` (ADR-0009).
const payload = await getPayloadAuth(config);

export const { GET, POST } = toNextJsHandler(payload.betterAuth.handler);
