import type { ActionErrorCode } from '@/constants/action';

/**
 * What kind of write is in flight against a key. Three rather than one because
 * the rendering and the failure behavior differ: a failed `ADD` stays dim, a
 * failed `DELETE` returns to full opacity.
 */
const PENDING_ACTION = {
  /** The record is being created and does not exist on the server yet. */
  ADD: 'add',

  /** The record exists and some of its fields are being changed. */
  UPDATE: 'update',

  /** The record exists and is being removed. */
  DELETE: 'delete',
} as const;

type PendingAction = (typeof PENDING_ACTION)[keyof typeof PENDING_ACTION];

/**
 * Failures the store itself produces, on top of the ones an action reports.
 * Like `ACTION_ERROR`, a code is its own message key under `actionError` in
 * both catalogs (`docs/agents/coding-standards/i18n.md`).
 */
const OPTIMISTIC_ERROR = {
  /** The tab was closed mid-request. No answer is ever coming, so nobody knows how the write ended. */
  INTERRUPTED: 'interrupted',

  /** The request outlived its deadline. It may still land, and its answer settles on top when it does. */
  TIMED_OUT: 'timedOut',
} as const;

/** Every code the store may hold against a key — an action's, or one of its own. */
type OptimisticErrorCode =
  | ActionErrorCode
  | (typeof OPTIMISTIC_ERROR)[keyof typeof OPTIMISTIC_ERROR];

/** The one `localStorage` slot every entry is written to, as a single JSON document. */
const OPTIMISTIC_STORAGE_KEY = 'grimoria:optimistic:v1';

/**
 * Names whose overlay the slot above holds. Written at sign-in and readable by
 * JavaScript on purpose: the scope has to be known during the first client
 * render, and a session read in the layout would opt every page out of static
 * rendering. It takes the session's own expiry, so an expired session drops it
 * without a request.
 */
const OPTIMISTIC_SCOPE_COOKIE_NAME = 'optimistic-scope';

/** Bumped when the stored shape changes. A document written by another version is discarded, never half-read. */
const OPTIMISTIC_SCHEMA_VERSION = 4;

/**
 * How long a write may stay in flight before the interface stops waiting on it.
 * A Server Action cannot be cancelled and carries no deadline of its own, so a
 * request nobody answers would leave the row dim for the life of the tab.
 */
const OPTIMISTIC_REQUEST_TIMEOUT_MS = 30_000;

/** A write faster than this shows no spinner at all — a flash of one reads as a glitch, not as progress. */
const OPTIMISTIC_PENDING_DELAY_MS = 200;

/**
 * How long an entry is worth rebuilding on a later page. A refused write is never
 * superseded by a render — only a dismissal ends one — so without an age nothing
 * ever clears an attempt nobody came back to, and the slot grows without bound.
 */
const OPTIMISTIC_ENTRY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** How long the store waits before writing to `localStorage`, so a burst of keystrokes costs one write. */
const OPTIMISTIC_PERSIST_DEBOUNCE_MS = 200;

export type { OptimisticErrorCode, PendingAction };
export {
  OPTIMISTIC_ENTRY_MAX_AGE_MS,
  OPTIMISTIC_ERROR,
  OPTIMISTIC_PENDING_DELAY_MS,
  OPTIMISTIC_PERSIST_DEBOUNCE_MS,
  OPTIMISTIC_REQUEST_TIMEOUT_MS,
  OPTIMISTIC_SCHEMA_VERSION,
  OPTIMISTIC_SCOPE_COOKIE_NAME,
  OPTIMISTIC_STORAGE_KEY,
  PENDING_ACTION,
};
