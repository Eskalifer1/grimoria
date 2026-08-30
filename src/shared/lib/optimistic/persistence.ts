import { ACTION_ERROR } from '@/constants/action';
import {
  OPTIMISTIC_ENTRY_MAX_AGE_MS,
  OPTIMISTIC_ERROR,
  OPTIMISTIC_SCHEMA_VERSION,
  type OptimisticErrorCode,
  PENDING_ACTION,
  type PendingAction,
} from '@/constants/optimistic';
import type { ActionFieldErrors } from '@/shared/lib/actionResult';
import {
  emptyEntry,
  isEntryLive,
  NO_ATTEMPT,
  OPTIMISTIC_ENTRY_PERSISTENCE,
  type OptimisticEntry,
  type OptimisticFailure,
} from '@/shared/lib/optimistic/entry';
import { interruptEntry } from '@/shared/lib/optimistic/transitions';

/** Every key's entry as one document, versioned so a shape from another release is recognizable. */
interface OptimisticDocument {
  version: number;

  /**
   * Whose overlay this is — a User id, or `null` for nobody signed in. One slot
   * serves the whole browser, so without this the failure one User walked away
   * from renders to the next one on the same machine.
   */
  scope: string | null;

  entries: Record<string, Partial<OptimisticEntry>>;
}

/** The fields that cross a reload, taken from the one decision map rather than repeated here. */
const PERSISTED_FIELDS = new Set(
  Object.entries(OPTIMISTIC_ENTRY_PERSISTENCE)
    .filter(([, isPersisted]) => isPersisted)
    .map(([field]) => field),
);

const PENDING_ACTIONS: readonly PendingAction[] = Object.values(PENDING_ACTION);

const OPTIMISTIC_ERROR_CODES: readonly OptimisticErrorCode[] = [
  ...Object.values(ACTION_ERROR),
  ...Object.values(OPTIMISTIC_ERROR),
];

/** The scope a stored document was written under. Anything that is not a string is nobody. */
function documentScope(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Whose overlay the slot currently holds, without rebuilding a single entry.
 * What a scope change is decided by: a document belonging to somebody else is
 * not this session's to read, and not its to keep either.
 */
function readScope(stored: string | null): string | null {
  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return isPlainObject(parsed) ? documentScope(parsed.scope) : null;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether the slot holds something no read will ever return — a document written
 * under another schema version, or bytes that are not a document at all. Every
 * read discards it whole and nothing overwrites the slot until the next write, so
 * without asking this it would sit in the browser's quota indefinitely.
 *
 * A document under another **scope** is not this: it belongs to a User who may
 * sign back in, and dropping it is `setScope`'s decision rather than a read's.
 */
function isUnreadableDocument(stored: string | null): boolean {
  if (!stored) {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return !isPlainObject(parsed) || parsed.version !== OPTIMISTIC_SCHEMA_VERSION;
  } catch {
    return true;
  }
}

function toPendingAction(value: unknown): PendingAction | null {
  return PENDING_ACTIONS.find((action) => action === value) ?? null;
}

function toFieldErrors(value: unknown): ActionFieldErrors | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const fields: Record<string, readonly string[]> = {};

  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages) && messages.every((message) => typeof message === 'string')) {
      fields[field] = messages;
    }
  }

  return Object.keys(fields).length === 0 ? null : fields;
}

function toFailure(value: unknown): OptimisticFailure | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const code = OPTIMISTIC_ERROR_CODES.find((known) => known === value.code);

  if (!code) {
    return null;
  }

  return {
    code,
    fields: toFieldErrors(value.fields),
    // A number from a page that is gone. It is only ever compared with another
    // number out of the same document, so restoring it keeps a dismissal exact.
    attempt: typeof value.attempt === 'number' ? value.attempt : NO_ATTEMPT,
  };
}

/**
 * Rebuilds one entry from untyped JSON. Every value is narrowed rather than
 * asserted — the document is ours, but a half-written slot or a hand-edited one
 * must degrade to "no entry" instead of to a type the rest of the store trusts.
 */
function toEntry(value: unknown, at: number): OptimisticEntry | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const { patch, pendingAction, pendingFields, fieldErrors, sourceVersion } = value;

  if (
    !isPlainObject(patch) ||
    !isPlainObject(pendingFields) ||
    !isPlainObject(fieldErrors) ||
    !(typeof pendingAction === 'string' || pendingAction === null) ||
    !(typeof sourceVersion === 'string' || sourceVersion === null)
  ) {
    return null;
  }

  // A stamp from the future — a skewed clock, a document synced from another
  // machine — never ages, so an entry that could outlive its own expiry is
  // dropped. A skew smaller than that window is clocks disagreeing, and clamps.
  const stamp = typeof value.touchedAt === 'number' ? value.touchedAt : at;

  if (stamp - at > OPTIMISTIC_ENTRY_MAX_AGE_MS) {
    return null;
  }

  const entry = emptyEntry(Math.min(stamp, at));

  entry.patch = patch;
  entry.pendingAction = toPendingAction(pendingAction);
  entry.sourceVersion = sourceVersion;
  entry.error = toFailure(value.error);

  for (const [field, action] of Object.entries(pendingFields)) {
    const parsed = toPendingAction(action);

    if (parsed) {
      entry.pendingFields[field] = parsed;
    }
  }

  for (const [field, failure] of Object.entries(fieldErrors)) {
    const parsed = toFailure(failure);

    if (parsed) {
      entry.fieldErrors[field] = parsed;
    }
  }

  return entry;
}

/** Writes only what `OPTIMISTIC_ENTRY_PERSISTENCE` marks as crossing a reload, under one scope. */
function serializeEntries(
  entries: Record<string, OptimisticEntry>,
  scope: string | null = null,
): string {
  // Not `document`: that is a global in every browser build, and shadowing it here
  // is one careless edit away from writing the DOM's into the slot.
  const written: OptimisticDocument = {
    version: OPTIMISTIC_SCHEMA_VERSION,
    scope,
    entries: {},
  };

  for (const [key, entry] of Object.entries(entries)) {
    const persisted: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(entry)) {
      if (PERSISTED_FIELDS.has(field)) {
        persisted[field] = value;
      }
    }

    written.entries[key] = persisted;
  }

  return JSON.stringify(written);
}

/**
 * Reads the slot as it was written. A document from another schema version is
 * discarded whole rather than half-read; **so is one written under another
 * scope** — the overlay belongs to whoever wrote it, and reading it back under a
 * different session is how one User is shown another's unsaved work. A single
 * malformed entry takes only itself down; an entry past
 * `OPTIMISTIC_ENTRY_MAX_AGE_MS` is dropped.
 *
 * This is the read for a change another tab made, where a pending entry means a
 * live request somewhere else. `hydrateEntries` is the read for a page load.
 */
function readEntries(
  stored: string | null,
  at: number,
  scope: string | null = null,
): Record<string, OptimisticEntry> {
  if (!stored) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stored);
  } catch {
    return {};
  }

  if (
    !isPlainObject(parsed) ||
    parsed.version !== OPTIMISTIC_SCHEMA_VERSION ||
    !isPlainObject(parsed.entries) ||
    documentScope(parsed.scope) !== scope
  ) {
    return {};
  }

  const entries: Record<string, OptimisticEntry> = {};

  for (const [key, value] of Object.entries(parsed.entries)) {
    const entry = toEntry(value, at);

    if (entry && at - entry.touchedAt <= OPTIMISTIC_ENTRY_MAX_AGE_MS && isEntryLive(entry)) {
      entries[key] = entry;
    }
  }

  return entries;
}

/**
 * The page-load read. Every entry still in flight becomes a failure — the page
 * that would have received the answer is gone, so no answer is ever coming.
 */
function hydrateEntries(
  stored: string | null,
  at: number,
  scope: string | null = null,
): Record<string, OptimisticEntry> {
  const entries = readEntries(stored, at, scope);

  for (const [key, entry] of Object.entries(entries)) {
    entries[key] = interruptEntry(entry, at);
  }

  return entries;
}

export type { OptimisticDocument };
export { hydrateEntries, isUnreadableDocument, readEntries, readScope, serializeEntries };
