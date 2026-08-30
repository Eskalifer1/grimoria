import type { z } from 'zod';

import { ACTION_ERROR } from '@/constants/action';
import { isActionError } from '@/shared/lib/actionError';
import {
  type ActionResult,
  actionFailure,
  actionSuccess,
  toFieldErrors,
} from '@/shared/lib/actionResult';

import { planMockCall, titleShortcutFailure } from './mockControls';
import { readMockControls, writeMockControls } from './mockControlsStore';
import { getMockNotes, type MockNote } from './mockDatabase';

/** What a mock handler is handed: its parsed input, and the in-memory store to write to. */
interface MockActionContext<TInput> {
  input: TInput;
  notes: Map<string, MockNote>;
}

interface MockActionDefinition<TSchema extends z.ZodType, TData> {
  /** Dotted identifier, matching the real action it stands in for — `notes.create`. */
  name: string;

  schema: TSchema;

  handler: (context: MockActionContext<z.output<TSchema>>) => Promise<TData>;
}

function delay(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * `createAction`'s pipeline with the Payload half removed — parse, obey the
 * control panel, run the handler, answer with an `ActionResult`.
 *
 * It deliberately does not reuse `createAction`: that awaits `getPayloadClient()`
 * as its first statement, so sharing the wrapper would boot Payload and connect
 * to Neon for a write that never leaves memory. What it does keep is everything
 * the client can see — the result shape, the shared `ACTION_ERROR` codes, the
 * per-field messages — so no caller can tell the mock from the real thing.
 *
 * A failure is decided **before** the handler runs, so a failed call leaves the
 * store untouched and teaches the client no rollback rule the real backend will
 * never need.
 */
function createMockAction<TSchema extends z.ZodType, TData>(
  definition: MockActionDefinition<TSchema, TData>,
): (input: z.input<TSchema>) => Promise<ActionResult<TData>> {
  return async (input) => {
    try {
      const controls = await readMockControls();
      const plan = planMockCall(controls);

      if (controls.nextFailure !== null || controls.nextLatencyMs !== null) {
        await writeMockControls(plan.remaining);
      }

      await delay(plan.latencyMs);

      const parsed = definition.schema.safeParse(input);

      if (!parsed.success) {
        return actionFailure(ACTION_ERROR.INVALID_INPUT, toFieldErrors(parsed.error));
      }

      const failure = plan.failure ?? titleShortcutFailure(parsed.data);

      if (failure !== null) {
        return actionFailure(failure);
      }

      return actionSuccess(await definition.handler({ input: parsed.data, notes: getMockNotes() }));
    } catch (error) {
      if (isActionError(error)) {
        return actionFailure(error.code, error.fields);
      }

      console.error({ action: definition.name, err: error }, 'Mock action threw');

      return actionFailure(ACTION_ERROR.UNEXPECTED);
    }
  };
}

export type { MockActionContext, MockActionDefinition };
export { createMockAction };
