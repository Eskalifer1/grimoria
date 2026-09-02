/**
 * What a write in flight takes away from a form. `none` is the optimistic
 * default: the answer is already on screen, so nothing is disabled. `submit` is
 * the one lock a blocking form is allowed — the write must not be repeated, and
 * the inputs stay live (`docs/features/data-access/pattern-c.md`).
 */
const SUBMIT_LOCK = {
  NONE: 'none',
  SUBMIT: 'submit',
} as const;

type SubmitLock = (typeof SUBMIT_LOCK)[keyof typeof SUBMIT_LOCK];

/**
 * Who answers with a field's value once a write settles. `surface` is a store
 * that holds the value and normalizes it; `form` is a write whose answer arrives
 * at the call and nowhere else (`docs/features/forms.md`).
 */
const VALUE_OWNER = {
  SURFACE: 'surface',
  FORM: 'form',
} as const;

type ValueOwner = (typeof VALUE_OWNER)[keyof typeof VALUE_OWNER];

/**
 * The mark a required field carries beside its label. A glyph rather than copy —
 * it reads the same in every locale, and `aria-required` is what says it out loud.
 */
const REQUIRED_MARK = '*';

export type { SubmitLock, ValueOwner };
export { REQUIRED_MARK, SUBMIT_LOCK, VALUE_OWNER };
