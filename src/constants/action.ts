/**
 * The vocabulary every server call is described with — the status a call is in
 * and the failures any call may report. One object per set, because they are
 * read as a set and a bare `'failure'` at a call site is a rename nobody can
 * grep for (`docs/agents/coding-standards/abstraction.md`).
 */
const ACTION_STATUS = {
  /** Nothing has been sent yet. */
  IDLE: 'idle',

  /** Sent, not settled. Only a client ever holds this — a result carries a settled status. */
  PENDING: 'pending',

  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;

type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

/**
 * Failures shared by every action. **A code is its own message key** under
 * `actionError` in both catalogs — one vocabulary, no lookup table between the
 * wire value and the copy — which is why they are camelCase (`i18n.md`).
 * A domain adds its own codes to these, never instead of them.
 */
const ACTION_ERROR = {
  /** No session. The caller is a Guest and the action needed a User. */
  UNAUTHENTICATED: 'unauthenticated',

  /** A session, but not the right to do this — a role or an ownership check refused. */
  FORBIDDEN: 'forbidden',

  /** The input failed its schema. The failure carries the per-field messages. */
  INVALID_INPUT: 'invalidInput',

  /** The record the action addressed does not exist, or is not readable by this User. */
  NOT_FOUND: 'notFound',

  /** The write lost to a constraint — a unique index, a stale version. */
  CONFLICT: 'conflict',

  /** Anything that escaped as a thrown error. Logged server-side, opaque to the client. */
  UNEXPECTED: 'unexpected',
} as const;

type ActionErrorCode = (typeof ACTION_ERROR)[keyof typeof ACTION_ERROR];

/**
 * What an optimistic write does with the value on screen when it fails
 * (`docs/features/data-access.md` → Rollback versus keep).
 */
const FAILURE_BEHAVIOR = {
  /** Editing existing data: restore the server's value, so nothing unsaved is shown as saved. */
  ROLLBACK: 'rollback',

  /** Creating new data: leave it on screen and mark it failed, so nothing the User typed is thrown away. */
  KEEP: 'keep',
} as const;

type FailureBehavior = (typeof FAILURE_BEHAVIOR)[keyof typeof FAILURE_BEHAVIOR];

export type { ActionErrorCode, ActionStatus, FailureBehavior };
export { ACTION_ERROR, ACTION_STATUS, FAILURE_BEHAVIOR };
