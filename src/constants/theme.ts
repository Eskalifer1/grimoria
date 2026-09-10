/**
 * The Themes that exist. Everything else about a Theme derives from this list:
 * the `Theme` type, the User field's options, the copy catalogs under
 * `messages/`, and the token file per Theme in `src/styles/`.
 */
const THEMES = ['standard', 'dark-fantasy'] as const;

type Theme = (typeof THEMES)[number];

/** What a Guest with no cookie, and a User who never chose, is served. */
const DEFAULT_THEME: Theme = 'standard';

/**
 * The one thing that decides which Theme renders. `src/proxy.ts` is the only
 * reader; for a signed-in User the value is mirrored here at sign-in, so the
 * proxy needs no database call.
 */
const THEME_COOKIE_NAME = 'theme';

/**
 * A year, in seconds. The Theme is a device preference and survives sign-out —
 * it also words the sign-out screen, which would change tonality mid-sentence
 * if the cookie went with the session.
 */
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type { Theme };
export { DEFAULT_THEME, THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME, THEMES };
