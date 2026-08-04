import { cookies } from 'next/headers';

export const themes = ['standard', 'dark-fantasy'] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = 'standard';

export const themeCookieName = 'theme';

function isTheme(value: string | undefined): value is Theme {
  return themes.includes(value as Theme);
}

/**
 * The single place the active `Theme` is decided.
 *
 * Copy is resolved on the server (ADR-0004), so the theme has to be known
 * before the HTML is built — which is why guests get a cookie rather than
 * `localStorage`: the server never sees `localStorage`, and the page would
 * render standard copy and only swap to dark-fantasy after hydration.
 *
 * Logged-in users store their theme on their profile instead. That branch
 * belongs here too, but the `Users` collection doesn't exist yet (#32) and
 * neither does the toggle that writes it (#36) — so today this reads the
 * cookie for everyone. Adding the profile branch is an edit to this function
 * and nowhere else.
 *
 * Reading a cookie opts every localized route out of static rendering. That is
 * accepted deliberately: caching for the public notes page is a separate
 * concern (#46), and there is nothing cacheable to protect yet.
 */
export async function resolveTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(themeCookieName)?.value;

  return isTheme(value) ? value : defaultTheme;
}
