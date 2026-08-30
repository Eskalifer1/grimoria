import { ACTION_ERROR, type ActionErrorCode } from '@/constants/action';

/**
 * What a test tells the notes double to do: how slow to answer, and how to fail.
 * The panel that used to set these went with the mock (ticket 07); the double it
 * drove stayed, because the hooks still need something to be optimistic about.
 */
interface MockControls {
  /** Milliseconds every call waits before answering. */
  latencyMs: number;

  /** The next call only waits this instead, then the field clears. For out-of-order tests. */
  nextLatencyMs: number | null;

  /** The next call fails with this code, then the field clears. */
  nextFailure: ActionErrorCode | null;

  /** Every call fails with this code until it is cleared. */
  alwaysFailure: ActionErrorCode | null;

  /** Percentage of calls that fail with `UNEXPECTED`. */
  failureRate: number;
}

/** 800 ms is slow enough that a pending state is visible without feeling broken. */
const DEFAULT_MOCK_CONTROLS: MockControls = {
  latencyMs: 800,
  nextLatencyMs: null,
  nextFailure: null,
  alwaysFailure: null,
  failureRate: 0,
};

/** Titles that fail without a trip to the panel. */
const MOCK_TITLE_SHORTCUTS: Record<string, ActionErrorCode> = {
  fail: ACTION_ERROR.UNEXPECTED,
  conflict: ACTION_ERROR.CONFLICT,
};

/** What the controls say about one call, and what is left of them afterwards. */
interface MockCallPlan {
  /** How long this call waits before answering. */
  latencyMs: number;

  /** The code this call fails with, decided before the handler runs. */
  failure: ActionErrorCode | null;

  /** The controls with this call's one-shot fields consumed, to be written back. */
  remaining: MockControls;
}

/**
 * Decides a call from the controls: `nextFailure`, then `alwaysFailure`, then
 * `failureRate`. The one-shot fields are consumed whatever fires, so a call
 * never sees the same `nextFailure` twice.
 *
 * @param random injected so a `failureRate` test is not a coin flip
 */
function planMockCall(controls: MockControls, random: () => number = Math.random): MockCallPlan {
  const rolled = random() * 100 < controls.failureRate ? ACTION_ERROR.UNEXPECTED : null;

  return {
    latencyMs: controls.nextLatencyMs ?? controls.latencyMs,
    failure: controls.nextFailure ?? controls.alwaysFailure ?? rolled,
    remaining: { ...controls, nextLatencyMs: null, nextFailure: null },
  };
}

/** The panel-free shortcut: a note titled `fail` or `conflict` fails with that code. */
function titleShortcutFailure(input: unknown): ActionErrorCode | null {
  if (typeof input !== 'object' || input === null || !('title' in input)) {
    return null;
  }

  const { title } = input as { title: unknown };

  return typeof title === 'string' ? (MOCK_TITLE_SHORTCUTS[title] ?? null) : null;
}

export type { MockCallPlan, MockControls };
export { DEFAULT_MOCK_CONTROLS, MOCK_TITLE_SHORTCUTS, planMockCall, titleShortcutFailure };
