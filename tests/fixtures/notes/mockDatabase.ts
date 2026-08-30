/** A row of the notes double — a record shape for the hooks to be optimistic about. */
interface MockNote {
  id: string;
  title: string;
  body: string;
  done: boolean;
  updatedAt: string;
}

/** What the store holds after a reset. Three rows, so "newest first" has something to order. */
const MOCK_NOTE_SEED: readonly MockNote[] = [
  {
    id: '9f1c1c9e-0b2a-4b6f-9d3e-1a2b3c4d5e6f',
    title: 'Sharpen the quill',
    body: 'Nib, ink, blotter.',
    done: true,
    updatedAt: '2026-08-23T09:00:00.000Z',
  },
  {
    id: 'a3d2e4b1-7c58-4f0a-8e91-2b7c6d5f4a3b',
    title: 'Copy the marginalia',
    body: 'The notes in the second folio are the good ones.',
    done: false,
    updatedAt: '2026-08-24T09:00:00.000Z',
  },
  {
    id: 'c7b5a913-4e2d-4a87-b0f6-5d8e9c1a2b34',
    title: 'Bind the loose pages',
    body: '',
    done: false,
    updatedAt: '2026-08-25T09:00:00.000Z',
  },
];

interface MockDatabase {
  notes: Map<string, MockNote>;

  /** The last `updatedAt` handed out, so two writes in one millisecond still order. */
  lastWriteAt: number;
}

const database: MockDatabase = { notes: seededNotes(), lastWriteAt: newestSeedWrite() };

function getMockDatabase(): MockDatabase {
  return database;
}

function seededNotes(): Map<string, MockNote> {
  return new Map(MOCK_NOTE_SEED.map((note) => [note.id, { ...note }]));
}

/** The clock starts after the seed, so the first write sorts above it whatever the machine's date is. */
function newestSeedWrite(): number {
  return Math.max(...MOCK_NOTE_SEED.map((note) => Date.parse(note.updatedAt)));
}

/** The live store. Handlers write to it directly; there is nothing to commit. */
function getMockNotes(): Map<string, MockNote> {
  return getMockDatabase().notes;
}

/** Drops everything written and puts the seed back. */
function seedMockDatabase(): void {
  const database = getMockDatabase();

  database.notes = seededNotes();
  database.lastWriteAt = newestSeedWrite();
}

/**
 * The `updatedAt` for a write, always strictly later than the last one. The store
 * compares it against `sourceVersion`, so a tie would silently disable the
 * staleness rule and every version test would pass for the wrong reason.
 */
function nextMockTimestamp(): string {
  const database = getMockDatabase();

  database.lastWriteAt = Math.max(Date.now(), database.lastWriteAt + 1);

  return new Date(database.lastWriteAt).toISOString();
}

export type { MockNote };
export { getMockNotes, MOCK_NOTE_SEED, nextMockTimestamp, seedMockDatabase };
