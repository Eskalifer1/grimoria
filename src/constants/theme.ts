/**
 * The Themes that exist. Everything else about a Theme derives from this list:
 * the `Theme` type, the User field's options, the copy catalogs under
 * `messages/`, and the token file per Theme in `src/styles/`.
 */
const THEMES = ['standard', 'dark-fantasy'] as const;

type Theme = (typeof THEMES)[number];

/** What a Guest with no cookie, and a User who never chose, is served. */
const DEFAULT_THEME: Theme = 'standard';

/** Carries a Guest's choice; a logged-in User is read from their profile. */
const THEME_COOKIE_NAME = 'theme';

export type { Theme };
export { DEFAULT_THEME, THEME_COOKIE_NAME, THEMES };
