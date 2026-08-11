import { DEFAULT_THEME, THEMES, type Theme } from '@/constants/theme';

/**
 * Narrows a value that came from outside TypeScript's reach — a cookie, a
 * database column, a URL — to a `Theme`.
 */
function isTheme(value: string | undefined | null): value is Theme {
  return THEMES.includes(value as Theme);
}

/** Same source of values as `isTheme`, resolved to a usable `Theme`. */
function toTheme(value: string | undefined | null): Theme {
  return isTheme(value) ? value : DEFAULT_THEME;
}

export { isTheme, toTheme };
