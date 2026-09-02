/**
 * Why a schema refused a value. **A code is its own message key** under
 * `validation` in both catalogs, the way `ACTION_ERROR` is under `actionError`,
 * so a rule is worded once per Theme rather than once per field (`i18n.md`).
 *
 * A rule with a bound carries it as `limit` — one parameter name across the set,
 * because a message per field would multiply by every field and every Theme.
 */
const VALIDATION_ERROR = {
  /** A required value arrived empty, or whitespace only. */
  REQUIRED: 'required',

  /** Shorter than the rule allows. Carries the bound as `limit`. */
  TOO_SHORT: 'tooShort',

  /** Longer than the rule allows. Carries the bound as `limit`. */
  TOO_LONG: 'tooLong',
} as const;

type ValidationErrorCode = (typeof VALIDATION_ERROR)[keyof typeof VALIDATION_ERROR];

export type { ValidationErrorCode };
export { VALIDATION_ERROR };
