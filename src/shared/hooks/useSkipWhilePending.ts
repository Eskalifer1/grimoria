'use client';

import { useRef } from 'react';

/**
 * Wraps an async call so a second one made while the first is still out is
 * dropped, and answers whether the call was made.
 *
 * **A ref, not state.** A repeat can arrive inside the same tick — held Enter
 * auto-repeats, a double click lands before React flushes — and a flag read off
 * the last render has not heard about the first call yet.
 *
 * `isEnabled` is for a caller whose repeat is sometimes legitimate: an optimistic
 * write has its answer on screen already, so a second submit is a second write
 * rather than a duplicate of the first.
 *
 * @param isEnabled whether to drop the repeat at all. Disabled, every call goes through
 * @returns whether the call was made, so the caller can refuse the event it came on
 */
function useSkipWhilePending<TArgs extends unknown[]>(
  run: (...args: TArgs) => Promise<unknown>,
  isEnabled = true,
): (...args: TArgs) => boolean {
  const isInFlight = useRef(false);

  return (...args) => {
    if (isEnabled && isInFlight.current) {
      return false;
    }

    isInFlight.current = true;

    // Freed on either outcome, and the rejection handled here rather than left to
    // surface as an unhandled one: a call that broke has still ended, and holding
    // the lock open would lock the caller out for the life of the component.
    // **What went wrong is the caller's to report** — `run` answers to itself.
    const free = () => {
      isInFlight.current = false;
    };

    // `try`, because a `run` that throws before it returns a promise never
    // reaches `then` — and the lock, already taken, would never be given back.
    try {
      run(...args).then(free, free);
    } catch (thrown) {
      free();

      throw thrown;
    }

    return true;
  };
}

export { useSkipWhilePending };
