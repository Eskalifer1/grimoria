import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import {
  TOAST_FAILURE_DURATION_MS,
  TOAST_MESSAGE,
  TOAST_SCOPE,
  TOAST_SUCCESS_DURATION_MS,
} from '@/constants/toast';
import { runAction } from '@/shared/lib/action/runAction';
import { actionFailure, actionSuccess } from '@/shared/lib/actionResult';

const { error, success } = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock('sonner', () => ({ toast: { error, success } }));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** The id and duration a raise carried, which is what the id rule is asserted through. */
function raisedOptions(raise: typeof error) {
  return raise.mock.calls.map((call) => call[1]);
}

describe('a failure', () => {
  it('raises a toast carrying the code it failed with', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.FORBIDDEN));

    expect(error).toHaveBeenCalledTimes(1);
    expect(raisedOptions(error)).toEqual([
      { id: ACTION_ERROR.FORBIDDEN, duration: TOAST_FAILURE_DURATION_MS },
    ]);
  });

  it('is returned to the caller whether or not it was spoken', async () => {
    const result = await runAction(async () => actionFailure(ACTION_ERROR.CONFLICT), {
      isSilent: true,
    });

    expect(result.error).toEqual({ code: ACTION_ERROR.CONFLICT, fields: null });
  });

  it('leaves one toast on screen when the same code comes back twice', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.UNEXPECTED));
    await runAction(async () => actionFailure(ACTION_ERROR.UNEXPECTED));

    expect(raisedOptions(error).map((options) => options?.id)).toEqual([
      ACTION_ERROR.UNEXPECTED,
      ACTION_ERROR.UNEXPECTED,
    ]);
  });
});

describe('a caller whose surface draws its own failures', () => {
  it('stays quiet on a code the surface places, without having to ask', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.INVALID_INPUT));

    expect(error).not.toHaveBeenCalled();
  });

  it('still speaks a code that outlives the surface', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.UNAUTHENTICATED), {
      toast: { scope: TOAST_SCOPE.UNPLACED },
    });

    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe('a caller whose surface may be gone by the time the answer lands', () => {
  it('speaks a placed code too', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.INVALID_INPUT), {
      toast: { scope: TOAST_SCOPE.ALL },
    });

    expect(raisedOptions(error)).toEqual([
      { id: ACTION_ERROR.INVALID_INPUT, duration: TOAST_FAILURE_DURATION_MS },
    ]);
  });
});

describe('a caller that draws every failure itself', () => {
  it('speaks none of them, not even a code nothing else would place', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.UNEXPECTED), {
      toast: { scope: TOAST_SCOPE.NONE },
    });

    expect(error).not.toHaveBeenCalled();
  });

  it('still confirms a success, which has nowhere else to go', async () => {
    await runAction(async () => actionSuccess({ id: 'a1' }), {
      toast: { scope: TOAST_SCOPE.NONE, successMessage: TOAST_MESSAGE.SAVED },
    });

    expect(success).toHaveBeenCalledTimes(1);
  });
});

describe('two of these nested, as a form around an optimistic write', () => {
  it('says nothing, because both take the scope the form set', async () => {
    await runAction(
      () =>
        runAction(async () => actionFailure(ACTION_ERROR.UNEXPECTED), {
          toast: { scope: TOAST_SCOPE.NONE },
        }),
      { toast: { scope: TOAST_SCOPE.NONE } },
    );

    expect(error).not.toHaveBeenCalled();
  });

  it('leaves one sentence on screen where only one of the two was overridden', async () => {
    await runAction(() => runAction(async () => actionFailure(ACTION_ERROR.FORBIDDEN)), {
      toast: { scope: TOAST_SCOPE.UNPLACED },
    });

    // Two raises, one id, and the library replaces rather than stacks — asserted
    // against a real `<Toaster />` in `tests/shared/components/Toaster.test.tsx`.
    expect(raisedOptions(error).map((options) => options?.id)).toEqual([
      ACTION_ERROR.FORBIDDEN,
      ACTION_ERROR.FORBIDDEN,
    ]);
  });
});

describe('a write that says nothing', () => {
  it('raises nothing when it is silent', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.FORBIDDEN), { isSilent: true });

    expect(error).not.toHaveBeenCalled();
  });

  it('raises nothing when the toast alone is turned off', async () => {
    await runAction(async () => actionFailure(ACTION_ERROR.FORBIDDEN), {
      toast: { isEnabled: false },
    });

    expect(error).not.toHaveBeenCalled();
  });
});

describe('a success', () => {
  it('says nothing unless the caller named a sentence', async () => {
    await runAction(async () => actionSuccess({ id: 'a1' }));

    expect(success).not.toHaveBeenCalled();
  });

  it('raises the named sentence', async () => {
    await runAction(async () => actionSuccess({ id: 'a1' }), {
      toast: { successMessage: TOAST_MESSAGE.CREATED },
    });

    expect(raisedOptions(success)).toEqual([
      { id: TOAST_MESSAGE.CREATED, duration: TOAST_SUCCESS_DURATION_MS },
    ]);
  });

  it('stays quiet when the write is silent', async () => {
    await runAction(async () => actionSuccess({ id: 'a1' }), {
      toast: { successMessage: TOAST_MESSAGE.SAVED },
      isSilent: true,
    });

    expect(success).not.toHaveBeenCalled();
  });
});

describe('a write that throws instead of answering', () => {
  it('comes back as the unexpected failure, and is logged', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await runAction(async () => {
      throw new Error('transport');
    });

    expect(result.error).toEqual({ code: ACTION_ERROR.UNEXPECTED, fields: null });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
