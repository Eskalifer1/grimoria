import type { CollectionConfig, Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { withInviteExpiry } from '@/collections/admin-invitations';
import { ADMIN_INVITE_EXPIRES_IN } from '@/constants/user';

function collectionWith(fields: Field[]): CollectionConfig {
  return { slug: 'admin-invitations', fields };
}

const expiresAt: Field = { name: 'expiresAt', type: 'date', required: true };
const token: Field = { name: 'token', type: 'text' };

describe('withInviteExpiry', () => {
  it('gives expiresAt a default the plugin never supplies', () => {
    const [field] = withInviteExpiry({ collection: collectionWith([expiresAt]) }).fields;

    expect(field).toMatchObject({ name: 'expiresAt', required: true });
    expect(typeof (field as { defaultValue?: unknown }).defaultValue).toBe('function');
  });

  it('defaults to ADMIN_INVITE_EXPIRES_IN seconds from now', () => {
    const [field] = withInviteExpiry({ collection: collectionWith([expiresAt]) }).fields;
    const defaultValue = (field as { defaultValue: () => Date }).defaultValue;

    const before = Date.now();
    const value = defaultValue();

    expect(value.getTime() - before).toBeGreaterThanOrEqual(ADMIN_INVITE_EXPIRES_IN * 1000);
    expect(value.getTime() - Date.now()).toBeLessThanOrEqual(ADMIN_INVITE_EXPIRES_IN * 1000);
  });

  it('leaves every other field as it found it', () => {
    const { fields } = withInviteExpiry({ collection: collectionWith([token, expiresAt]) });

    expect(fields[0]).toBe(token);
  });

  it('changes nothing when the plugin stops omitting expiresAt', () => {
    const { fields } = withInviteExpiry({ collection: collectionWith([token]) });

    expect(fields).toEqual([token]);
  });
});
