/**
 * The only place the note key format is written. A key is built here and read
 * everywhere, so two screens writing the same note cannot address it differently
 * — which is the one failure an optimistic overlay cannot recover from.
 */
function noteKey(id: string): string {
  return `note:${id}`;
}

/** The collection itself, for a write that changes the list rather than one row. */
const NOTE_LIST_KEY = 'note:list';

export { NOTE_LIST_KEY, noteKey };
