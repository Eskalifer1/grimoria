import { theme } from 'next/root-params';

import type { Theme } from '@/constants/theme';

import { toTheme } from './theme';

/**
 * The single place the active `Theme` is decided.
 *
 * Copy is resolved on the server (ADR-0004), so the Theme has to be known before
 * the HTML is built. It arrives as the hidden `[theme]` root segment the proxy
 * rewrote the request onto, which is what lets both Themes be prerendered — a
 * cookie or a session read here would opt every page out of static rendering.
 *
 * `src/proxy.ts` is the only reader of the Theme cookie, and a signed-in User's
 * profile value is mirrored into that cookie at sign-in
 * (`docs/features/auth.md`).
 */
async function resolveTheme(): Promise<Theme> {
  return toTheme(await theme());
}

export { resolveTheme };
