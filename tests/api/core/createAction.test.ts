import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { Payload } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createAction, createProtectedAction } from '@/api/core/createAction';
import { getPayloadClient } from '@/api/core/payloadClient';
import { getSessionUser, requireSessionUser } from '@/api/core/session';
import { ACTION_ERROR, ACTION_STATUS } from '@/constants/action';
import type { User } from '@/payload-types';
import { ActionError, forbiddenError } from '@/shared/lib/actionError';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/api/core/session', () => ({
  getSessionUser: vi.fn(),
  requireSessionUser: vi.fn(),
}));

vi.mock('@/api/core/payloadClient', () => ({ getPayloadClient: vi.fn() }));

const logger = { debug: vi.fn(), error: vi.fn() };
// The wrapper touches nothing else on the client; the cast keeps that visible.
const payloadClient = { logger } as unknown as Payload;

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'merlin@example.com',
  role: ['user'],
} as unknown as User;
const schema = z.object({ name: z.string().min(1) });

function signedIn(): void {
  vi.mocked(getSessionUser).mockResolvedValue(user);
  vi.mocked(requireSessionUser).mockResolvedValue(user);
}

function guest(): void {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  vi.mocked(requireSessionUser).mockRejectedValue(new ActionError(ACTION_ERROR.UNAUTHENTICATED));
}

describe('createProtectedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPayloadClient).mockResolvedValue(payloadClient);
    signedIn();
  });

  it('refuses a Guest before the handler runs', async () => {
    guest();

    const handler = vi.fn();
    const action = createProtectedAction({ name: 'test.guest', schema, handler });

    expect(await action({ name: 'Merlin' })).toEqual({
      status: ACTION_STATUS.FAILURE,
      data: null,
      error: { code: ACTION_ERROR.UNAUTHENTICATED, fields: null },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('hands the handler the parsed input, the caller and the client', async () => {
    const handler = vi.fn(async () => ({ ok: true }));
    const action = createProtectedAction({ name: 'test.context', schema, handler });

    const result = await action({ name: 'Merlin' });

    expect(result).toEqual({ status: ACTION_STATUS.SUCCESS, data: { ok: true }, error: null });
    expect(handler).toHaveBeenCalledWith({
      input: { name: 'Merlin' },
      user,
      payload: payloadClient,
    });
  });

  it('rejects input the schema refuses, with a message per field', async () => {
    const handler = vi.fn();
    const action = createProtectedAction({ name: 'test.input', schema, handler });

    const result = await action({ name: '' });

    expect(result.status).toBe(ACTION_STATUS.FAILURE);
    expect(result.error?.code).toBe(ACTION_ERROR.INVALID_INPUT);
    expect(result.error?.fields?.name).toHaveLength(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('refuses when authorize says no, without running the handler', async () => {
    const handler = vi.fn();
    const action = createProtectedAction({
      name: 'test.authorize',
      schema,
      authorize: () => false,
      handler,
    });

    expect((await action({ name: 'Merlin' })).error?.code).toBe(ACTION_ERROR.FORBIDDEN);
    expect(handler).not.toHaveBeenCalled();
  });

  it('maps a thrown ActionError to its own code', async () => {
    const action = createProtectedAction({
      name: 'test.refusal',
      schema,
      handler: async () => {
        throw forbiddenError('not yours');
      },
    });

    expect((await action({ name: 'Merlin' })).error).toEqual({
      code: ACTION_ERROR.FORBIDDEN,
      fields: null,
    });
  });

  it('answers UNEXPECTED for any other throw and keeps the detail server-side', async () => {
    const action = createProtectedAction({
      name: 'test.defect',
      schema,
      handler: async () => {
        throw new Error('connection terminated: password authentication failed');
      },
    });

    const result = await action({ name: 'Merlin' });

    expect(result.error).toEqual({ code: ACTION_ERROR.UNEXPECTED, fields: null });
    expect(JSON.stringify(result)).not.toContain('password');
    expect(logger.error).toHaveBeenCalled();
  });

  it('answers CONFLICT when the write lost to a unique index', async () => {
    const action = createProtectedAction({
      name: 'test.conflict',
      schema,
      handler: async () => {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
        });
      },
    });

    const result = await action({ name: 'Merlin' });

    expect(result.error).toEqual({ code: ACTION_ERROR.CONFLICT, fields: null });
    // A constraint refusing a write is an answer, not a defect worth a stack trace.
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('answers UNEXPECTED when the Payload client cannot come up', async () => {
    vi.mocked(getPayloadClient).mockRejectedValue(new Error('DATABASE_URI is unreachable'));

    const action = createProtectedAction({
      name: 'test.noClient',
      schema,
      handler: async () => ({ ok: true }),
    });

    expect((await action({ name: 'Merlin' })).error?.code).toBe(ACTION_ERROR.UNEXPECTED);
  });

  it('revalidates only after the write succeeds', async () => {
    const paths = ['/[locale]/profile'];
    const failing = createProtectedAction({
      name: 'test.noRevalidate',
      schema,
      revalidatePaths: paths,
      handler: async () => {
        throw forbiddenError();
      },
    });

    await failing({ name: 'Merlin' });
    expect(revalidatePath).not.toHaveBeenCalled();

    const succeeding = createProtectedAction({
      name: 'test.revalidate',
      schema,
      revalidatePaths: paths,
      handler: async () => ({ ok: true }),
    });

    await succeeding({ name: 'Merlin' });
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/profile', 'page');
  });

  it('still reports success when revalidation itself fails', async () => {
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('no such route');
    });

    const action = createProtectedAction({
      name: 'test.revalidateThrows',
      schema,
      revalidatePaths: ['/[locale]/profile'],
      handler: async () => ({ ok: true }),
    });

    expect((await action({ name: 'Merlin' })).status).toBe(ACTION_STATUS.SUCCESS);
    expect(logger.error).toHaveBeenCalled();
  });

  it('lets a handler navigate, rather than reporting the navigation as a defect', async () => {
    const action = createProtectedAction({
      name: 'test.redirects',
      schema,
      handler: async () => {
        redirect('/');

        return { ok: true };
      },
    });

    // `redirect` throws a sentinel Next has to see. Swallowed, the navigation never
    // happens and a committed write reads to the User as one to retry.
    await expect(action({ name: 'Merlin' })).rejects.toThrow();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('createAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPayloadClient).mockResolvedValue(payloadClient);
  });

  it('lets a Guest through with a null user', async () => {
    guest();

    const handler = vi.fn(async () => ({ ok: true }));
    const action = createAction({ name: 'test.open', schema, handler });

    expect((await action({ name: 'Merlin' })).status).toBe(ACTION_STATUS.SUCCESS);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ user: null }));
  });
});
