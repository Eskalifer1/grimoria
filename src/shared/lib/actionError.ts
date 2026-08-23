import { ACTION_ERROR, type ActionErrorCode } from '@/constants/action';
import type { ActionFieldErrors } from '@/shared/lib/actionResult';

/**
 * A refusal a handler raises on purpose, carrying the code the caller will
 * branch on. Throwing it is how a handler gets out of a nested call without
 * threading a result back up by hand; the action wrapper turns it into the
 * failure member and never lets it cross the client boundary.
 *
 * Anything else that throws is a defect, and is reported as `UNEXPECTED`.
 */
class ActionError extends Error {
  /** Which failure this is — the value the client renders copy from. */
  readonly code: ActionErrorCode;

  /** Schema messages per field, when the refusal is about the input. */
  readonly fields: ActionFieldErrors | null;

  /**
   * @param message server-side only — it reaches the log, never the client
   */
  constructor(
    code: ActionErrorCode,
    options: { message?: string; fields?: ActionFieldErrors | null; cause?: unknown } = {},
  ) {
    super(options.message ?? code, { cause: options.cause });

    this.name = 'ActionError';
    this.code = code;
    this.fields = options.fields ?? null;
  }
}

/** Whether a thrown value is a deliberate refusal rather than a defect. */
function isActionError(error: unknown): error is ActionError {
  return error instanceof ActionError;
}

/** The refusal for a caller holding a session but not the right to do this. */
function forbiddenError(message?: string): ActionError {
  return new ActionError(ACTION_ERROR.FORBIDDEN, { message });
}

export { ActionError, forbiddenError, isActionError };
