import { z } from 'zod';

/** Room for a headline, not a paragraph — the real collection will pick its own. */
const MOCK_NOTE_TITLE_MAX_LENGTH = 120;

const MOCK_NOTE_BODY_MAX_LENGTH = 2000;

/** The client mints the id before it writes (ADR-0010), so the contract takes one. */
const noteIdSchema = z.uuid();

const noteTitleSchema = z.string().trim().min(1).max(MOCK_NOTE_TITLE_MAX_LENGTH);

const noteBodySchema = z.string().trim().max(MOCK_NOTE_BODY_MAX_LENGTH);

export {
  MOCK_NOTE_BODY_MAX_LENGTH,
  MOCK_NOTE_TITLE_MAX_LENGTH,
  noteBodySchema,
  noteIdSchema,
  noteTitleSchema,
};
