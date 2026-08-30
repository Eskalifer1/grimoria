import { ACTION_STATUS } from '@/constants/action';
import type { ActionResult } from '@/shared/lib/actionResult';

import { MOCK_NOTE_SEED, type MockNote } from './mockDatabase';

/** A seed row by position, without an index check at every assertion site. */
function seedNote(index: number): MockNote {
  const note = MOCK_NOTE_SEED[index];

  if (note === undefined) {
    throw new Error(`the notes double has no seed row at index ${index}`);
  }

  return note;
}

/** Narrows a result to its data, failing the test with the code when the call refused. */
function expectSuccess<TData>(result: ActionResult<TData>): TData {
  if (result.status !== ACTION_STATUS.SUCCESS) {
    throw new Error(`expected a success, got ${result.error.code}`);
  }

  return result.data;
}

export { expectSuccess, seedNote };
