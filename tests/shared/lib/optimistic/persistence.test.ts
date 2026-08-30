import { describe, expect, it } from 'vitest';

import { ACTION_ERROR } from '@/constants/action';
import {
  OPTIMISTIC_ENTRY_MAX_AGE_MS,
  OPTIMISTIC_ERROR,
  OPTIMISTIC_SCHEMA_VERSION,
  PENDING_ACTION,
} from '@/constants/optimistic';
import type { OptimisticEntry } from '@/shared/lib/optimistic/entry';
import { hydrateEntries, readScope, serializeEntries } from '@/shared/lib/optimistic/persistence';
import { beginEntry, settleFailureEntry } from '@/shared/lib/optimistic/transitions';

/** The call a failure is filed under. Tests that do not correlate two of them share one. */
const ATTEMPT = 1;

const NOW = 1_700_000_000_000;

function pending(): OptimisticEntry {
  return beginEntry(
    null,
    { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Typed' }, sourceVersion: 'v1' },
    3,
    NOW,
  );
}

function failed(): OptimisticEntry {
  const settled = settleFailureEntry(
    pending(),
    { error: { code: ACTION_ERROR.CONFLICT } },
    ATTEMPT,
    NOW,
  );

  if (settled === null) {
    throw new Error('the failure left nothing behind');
  }

  return settled;
}

describe('serializeEntries', () => {
  it('stamps the document with the schema version', () => {
    expect(JSON.parse(serializeEntries({}))).toEqual({
      version: OPTIMISTIC_SCHEMA_VERSION,
      scope: null,
      entries: {},
    });
  });

  it('writes only the fields the persistence map marks as persisted', () => {
    const document: unknown = JSON.parse(serializeEntries({ 'note:1': failed() }));
    const entry = (document as { entries: Record<string, Record<string, unknown>> }).entries[
      'note:1'
    ];

    expect(entry).toBeDefined();
    expect(entry).not.toHaveProperty('latestCall');
    expect(Object.keys(entry ?? {}).sort()).toEqual([
      'error',
      'fieldErrors',
      'patch',
      'pendingAction',
      'pendingFields',
      'sourceVersion',
      'touchedAt',
    ]);
  });
});

describe('hydrateEntries', () => {
  it('survives a round trip through JSON', () => {
    const restored = hydrateEntries(serializeEntries({ 'note:1': failed() }), NOW);

    expect(restored['note:1']?.patch).toEqual({ title: 'Typed' });
    expect(restored['note:1']?.error).toMatchObject({ code: ACTION_ERROR.CONFLICT, fields: null });
    expect(restored['note:1']?.sourceVersion).toBe('v1');
  });

  it('restarts the call numbering, because no answer outlives the page that asked', () => {
    const restored = hydrateEntries(serializeEntries({ 'note:1': failed() }), NOW);

    expect(restored['note:1']?.latestCall).toBe(0);
  });

  it('turns an entry that was still in flight into a failure', () => {
    const restored = hydrateEntries(serializeEntries({ 'note:1': pending() }), NOW);

    expect(restored['note:1']?.pendingAction).toBeNull();
    expect(restored['note:1']?.error).toMatchObject({
      code: OPTIMISTIC_ERROR.INTERRUPTED,
      fields: null,
    });
  });

  it('reads nothing at all from an empty slot', () => {
    expect(hydrateEntries(null, NOW)).toEqual({});
    expect(hydrateEntries('', NOW)).toEqual({});
  });

  it('discards a document it cannot parse', () => {
    expect(hydrateEntries('{ not json', NOW)).toEqual({});
    expect(hydrateEntries('"a string"', NOW)).toEqual({});
  });

  it('discards a document written by a version it does not know, rather than half-reading it', () => {
    const document = JSON.parse(serializeEntries({ 'note:1': failed() })) as { version: number };

    document.version = OPTIMISTIC_SCHEMA_VERSION + 1;

    expect(hydrateEntries(JSON.stringify(document), NOW)).toEqual({});
  });

  it('drops the one malformed entry and keeps the rest', () => {
    const document = JSON.parse(serializeEntries({ 'note:1': failed() })) as {
      entries: Record<string, unknown>;
    };

    document.entries['note:2'] = { patch: 'not an object' };

    const restored = hydrateEntries(JSON.stringify(document), NOW);

    expect(Object.keys(restored)).toEqual(['note:1']);
  });

  it('drops an entry older than an attempt is worth keeping', () => {
    const raw = serializeEntries({ 'note:1': failed() });

    // A refused entry is never superseded by a later render, so age is the only
    // thing that ends one nobody came back to. Without it the slot grows forever.
    expect(hydrateEntries(raw, NOW + OPTIMISTIC_ENTRY_MAX_AGE_MS + 1)).toEqual({});
    expect(hydrateEntries(raw, NOW + OPTIMISTIC_ENTRY_MAX_AGE_MS - 1)).toHaveProperty('note:1');
  });

  it('measures age from the last write, not the first', () => {
    const old = { ...failed(), touchedAt: NOW - OPTIMISTIC_ENTRY_MAX_AGE_MS - 1 };
    const reopened = beginEntry(
      old,
      { action: PENDING_ACTION.UPDATE, optimisticData: { title: 'Just typed' } },
      2,
      NOW,
    );

    // A key busy for a week would otherwise expire the value typed into it a
    // second ago, and the expiry runs before the interrupt, so without a word.
    expect(hydrateEntries(serializeEntries({ 'note:1': reopened }), NOW)).toHaveProperty('note:1');
  });

  it('drops a stamp so far ahead of now that no expiry could ever reach it', () => {
    const skewed = { ...failed(), touchedAt: NOW + OPTIMISTIC_ENTRY_MAX_AGE_MS * 4 };

    expect(hydrateEntries(serializeEntries({ 'note:1': skewed }), NOW)).toEqual({});
  });

  it('clamps a small skew to now rather than dropping the entry', () => {
    const skewed = { ...failed(), touchedAt: NOW + 60_000 };
    const restored = hydrateEntries(serializeEntries({ 'note:1': skewed }), NOW);

    // Clocks disagree by seconds all the time; that is not a reason to eat work.
    expect(restored['note:1']?.touchedAt).toBe(NOW);
  });

  it('drops an entry that has nothing left to say', () => {
    const document = JSON.parse(serializeEntries({})) as { entries: Record<string, unknown> };

    document.entries['note:3'] = {
      patch: {},
      pendingAction: null,
      pendingFields: {},
      errors: {},
      fieldErrors: {},
      sourceVersion: null,
      touchedAt: NOW,
    };

    expect(hydrateEntries(JSON.stringify(document), NOW)).toEqual({});
  });
});

describe('the scope a document is written under', () => {
  it('is stamped on the document and read back off it', () => {
    expect(readScope(serializeEntries({ 'note:1': failed() }, 'user-1'))).toBe('user-1');
    expect(readScope(serializeEntries({}))).toBeNull();
    expect(readScope(null)).toBeNull();
    expect(readScope('not json')).toBeNull();
  });

  it('reads back under the scope that wrote it', () => {
    const raw = serializeEntries({ 'note:1': failed() }, 'user-1');

    expect(Object.keys(hydrateEntries(raw, NOW, 'user-1'))).toEqual(['note:1']);
  });

  it('is discarded whole under another scope, and under none', () => {
    const raw = serializeEntries({ 'note:1': failed() }, 'user-1');

    // One slot serves the whole browser. Read back under a different session, the
    // failure one User walked away from renders to the next on that machine.
    expect(hydrateEntries(raw, NOW, 'user-2')).toEqual({});
    expect(hydrateEntries(raw, NOW)).toEqual({});
  });
});
