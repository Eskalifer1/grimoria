import { describe, expect, it } from 'vitest';

import { PENDING_ACTION } from '@/constants/optimistic';
import { actionSuccess } from '@/shared/lib/actionResult';
import { optimisticDescriptor, patchField } from '@/shared/lib/optimistic/descriptor';

const probe = optimisticDescriptor({
  run: async (input: { id: string; title?: string }) =>
    actionSuccess({
      id: input.id,
      title: input.title ?? '',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  pending: PENDING_ACTION.UPDATE,
  key: (input) => `probe:${input.id}`,
  value: (data) => ({ title: data.title }),
  version: (data) => data.updatedAt,
});

describe('optimisticDescriptor', () => {
  it('hands the declaration back, so a descriptor is a value and not a registry entry', () => {
    expect(probe.key({ id: '7' })).toBe('probe:7');
    expect(probe.pending).toBe(PENDING_ACTION.UPDATE);
  });

  it('types key and value against the action, rather than unknown', async () => {
    const result = await probe.run({ id: '7', title: 'Renamed' });

    // Both lines only compile because the inputs and the data are the action's own.
    expect(probe.value?.(result.data ?? { id: '', title: '', updatedAt: '' })).toEqual({
      title: 'Renamed',
    });
    expect(probe.version?.(result.data ?? { id: '', title: '', updatedAt: '' })).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });
});

describe('patchField', () => {
  it('answers the server value when the patch says nothing about the field', () => {
    expect(patchField({ body: 'other' }, 'title', 'Server')).toBe('Server');
    expect(patchField(undefined, 'title', 'Server')).toBe('Server');
  });

  it('answers the patch when it holds the field', () => {
    expect(patchField({ title: 'Typed' }, 'title', 'Server')).toBe('Typed');
    expect(patchField({ done: true }, 'done', false)).toBe(true);
  });

  it('falls back when the stored value is a list and the server value is not', () => {
    // `typeof` collapses every object to one word, so this is the whole guard
    // between a stale document and a component reading a shape it cannot render.
    expect(patchField({ author: [1, 2] }, 'author', { name: 'Merlin' })).toEqual({
      name: 'Merlin',
    });
    expect(patchField({ tags: { a: 1 } }, 'tags', ['one'])).toEqual(['one']);
  });

  it('falls back when the stored value is not the shape the server value is', () => {
    // A document written by an older build, or by hand. Rendering a number where
    // a string belongs is a crash the User cannot dismiss.
    expect(patchField({ title: 12 }, 'title', 'Server')).toBe('Server');
  });

  it('overlays a nullable field the server has nothing in', () => {
    // Measured by `typeof`, an empty server value reads as `'object'` and every
    // overlay on it would be dropped: the User types, saves, and the value never
    // changes on screen.
    expect(patchField({ bio: 'Typed' }, 'bio', null)).toBe('Typed');
  });

  it('lets a field be optimistically cleared', () => {
    // `null` is a value a nullable field legitimately takes, and clearing one is
    // a write like any other.
    expect(patchField({ bio: null }, 'bio', 'Server')).toBeNull();
  });
});
