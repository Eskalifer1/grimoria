import type darkFantasy from '../../messages/en/dark-fantasy.json';
import type standard from '../../messages/en/standard.json';

/**
 * `standard` in the default locale is the source of truth for what keys exist.
 * Every other catalog — other themes now, other locales later (#18) — is
 * checked against it.
 */
type Messages = typeof standard;

/** Only accepts a catalog carrying the full `Messages` key set. */
type ThemeCatalog<T extends Messages> = T;

/**
 * Instantiating this is what turns a forgotten dark-fantasy key into a `tsc`
 * failure. Without it, the missing key would fall back to standard copy and
 * quietly print "Create a note" inside the dark-fantasy UI — the exact failure
 * the parallel-catalog shape was chosen to prevent.
 */
type DarkFantasyMessages = ThemeCatalog<typeof darkFantasy>;

export type { DarkFantasyMessages, Messages };
