import { VALIDATION_ERROR, type ValidationErrorCode } from '@/constants/validation';

/** What marks a resolver message as ours rather than the schema author's English. */
const VALIDATION_MESSAGE_PREFIX = 'validation';

const VALIDATION_CODES: readonly string[] = Object.values(VALIDATION_ERROR);

/** Stands in for a bound a rule did not carry, so a message always has something to interpolate. */
const NO_LIMIT = 0;

function isValidationErrorCode(value: string): value is ValidationErrorCode {
  return VALIDATION_CODES.includes(value);
}

/** A refusal a schema wrote down, before anything localized it. */
interface ValidationMessage {
  /** Which rule refused it, and so which sentence words the refusal. */
  code: ValidationErrorCode;

  /** The bound the rule enforces, and `0` for a rule that has none. */
  limit: number;
}

/**
 * The message a Zod rule carries instead of English. Zod holds one string per
 * rule and nothing else, so the code and its bound are packed into that string
 * and unpacked where the copy is read.
 *
 * @param limit the bound the rule enforces, for a rule that has one
 */
function validationMessage(code: ValidationErrorCode, limit?: number): string {
  return [VALIDATION_MESSAGE_PREFIX, code, limit].filter((part) => part !== undefined).join(':');
}

/**
 * Reads one back, and answers `null` for anything else — a schema still carrying
 * English, or a message from a library that never heard of this format.
 */
function parseValidationMessage(message: string): ValidationMessage | null {
  const [prefix, code, limit] = message.split(':');

  if (prefix !== VALIDATION_MESSAGE_PREFIX || !code || !isValidationErrorCode(code)) {
    return null;
  }

  const bound = Number(limit ?? NO_LIMIT);

  // A hand-written message can carry anything in the third part, and a bound that
  // is not a number interpolates as "NaN" into the sentence a User reads.
  return { code, limit: Number.isFinite(bound) ? bound : NO_LIMIT };
}

export type { ValidationMessage };
export { parseValidationMessage, validationMessage };
