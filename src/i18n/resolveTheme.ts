import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import config from '@payload-config';
import { getPayload } from 'payload';

import { THEME_COOKIE_NAME, type Theme } from '@/constants/theme';

import { toTheme } from './theme';

// One session read per request, not one per caller: `resolveTheme()` runs in
// next-intl's request config, well before the page that will ask for the same
// User, and `cache()` is what makes the second ask free.
const readUser = cache(async () => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });

  return user;
});

/**
 * The single place the active `Theme` is decided.
 *
 * Copy is resolved on the server (ADR-0004), so the theme has to be known
 * before the HTML is built — which is why guests get a cookie rather than
 * `localStorage`: the server never sees `localStorage`, and the page would
 * render standard copy and only swap to dark-fantasy after hydration.
 *
 * A logged-in User is read from their profile, and the cookie is ignored for
 * them: the cookie is client-writable and per-device, so letting it win would
 * put the Theme of a User outside the server's control and leave a change made
 * on one device invisible on another.
 *
 * Reading a cookie opts every localized route out of static rendering. That is
 * accepted deliberately: caching for the public notes page is a separate
 * concern, and there is nothing cacheable to protect yet.
 */
async function resolveTheme(): Promise<Theme> {
  const user = await readUser();

  if (user) {
    return toTheme(user.theme);
  }

  const cookieStore = await cookies();

  return toTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
}

export { resolveTheme };
