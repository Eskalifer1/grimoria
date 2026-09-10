/**
 * The one transient surface: where it sits, how long a message stays, and how
 * many stack before the oldest goes. A toast is the only feedback with nowhere
 * on screen to belong, so these are app-wide rather than per-surface
 * (`docs/features/forms.md`).
 */

/** Out of the reading column and away from the header, on every breakpoint. */
const TOAST_POSITION = 'bottom-right';

/** A failure is read twice — once to see it, once to believe it. */
const TOAST_FAILURE_DURATION_MS = 5000;

/** A confirmation is glanced at, so it leaves sooner than a failure. */
const TOAST_SUCCESS_DURATION_MS = 4000;

/** Beyond three the stack is a wall, and the oldest message is the least useful one. */
const TOAST_VISIBLE_LIMIT = 3;

/**
 * Which failures a call lets the toast speak for.
 *
 * **A write the store records takes `NONE`, and so does a form** — both already
 * draw every failure they get, and one problem stated twice reads as two.
 * **A bare call takes `UNPLACED`**, the default: nothing on screen holds it, but
 * a field or a footer might. **`ALL` is for a surface that may be gone** by the
 * time the answer lands — a row already removed from the list that held it.
 */
const TOAST_SCOPE = {
  ALL: 'all',
  UNPLACED: 'unplaced',
  NONE: 'none',
} as const;

type ToastScope = (typeof TOAST_SCOPE)[keyof typeof TOAST_SCOPE];

/**
 * The success sentences, keyed under `toast` in both catalogs. A write says
 * nothing unless it names one of these, so a Theme toggle stays quiet
 * (`docs/features/data-access.md`).
 */
const TOAST_MESSAGE = {
  /** An existing record now holds what the User typed. */
  SAVED: 'saved',

  /** A record that did not exist before this write does now. */
  CREATED: 'created',
} as const;

type ToastMessageKey = (typeof TOAST_MESSAGE)[keyof typeof TOAST_MESSAGE];

export type { ToastMessageKey, ToastScope };
export {
  TOAST_FAILURE_DURATION_MS,
  TOAST_MESSAGE,
  TOAST_POSITION,
  TOAST_SCOPE,
  TOAST_SUCCESS_DURATION_MS,
  TOAST_VISIBLE_LIMIT,
};
