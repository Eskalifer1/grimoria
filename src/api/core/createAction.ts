import 'server-only';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import type { Payload } from 'payload';
import type { z } from 'zod';

import { getPayloadClient } from '@/api/core/payloadClient';
import { getSessionUser, requireSessionUser } from '@/api/core/session';
import { isUniqueViolation } from '@/api/core/uniqueViolation';
import { ACTION_ERROR } from '@/constants/action';
import type { User } from '@/payload-types';
import { isActionError } from '@/shared/lib/actionError';
import {
  type ActionResult,
  actionFailure,
  actionSuccess,
  toFieldErrors,
} from '@/shared/lib/actionResult';

/** What a handler is handed: its input, already parsed, the caller, and the client to write with. */
interface ActionContext<TInput, TUser extends User | null> {
  /** The schema's output — trimmed, coerced, and proven to match. */
  input: TInput;

  /** The caller. `User` in a protected action, `User | null` in an open one. */
  user: TUser;

  /** The request's Payload instance. Writes pass `overrideAccess: false` and this `user`. */
  payload: Payload;
}

/** What an action is made of. Everything except `handler` is the boilerplate the wrapper owns. */
interface ActionDefinition<TSchema extends z.ZodType, TData, TUser extends User | null> {
  /** Dotted identifier for the logs — `user.updateName`. Never shown to a User. */
  name: string;

  /** The input contract. An action taking nothing declares `z.object({})`. */
  schema: TSchema;

  /**
   * The right to perform this, decided after parsing and before the write. `false`
   * fails the call with `FORBIDDEN`. Collection access control still runs underneath;
   * this is what refuses early and with a code the client can read.
   */
  authorize?: (context: ActionContext<z.output<TSchema>, TUser>) => boolean | Promise<boolean>;

  /** The work itself. Returns the success payload, or throws an `ActionError` to refuse. */
  handler: (context: ActionContext<z.output<TSchema>, TUser>) => Promise<TData>;

  /**
   * Route patterns whose page data this write invalidates, revalidated only after
   * it succeeds — `ROUTE_PATTERNS`, not `ROUTES`, since Next matches the route
   * with its dynamic segments. Becomes tag-based in #95.
   */
  revalidatePaths?: readonly string[];
}

/** The callable an action file exports: input in, a settled result out, never a throw. */
type Action<TSchema extends z.ZodType, TData> = (
  input: z.input<TSchema>,
) => Promise<ActionResult<TData>>;

/**
 * Reports a defect server-side. Payload's logger carries it once the client is
 * up; before that — a failed initialization — the console is all there is.
 */
function logDefect(payload: Payload | undefined, action: string, error: unknown): void {
  if (payload === undefined) {
    console.error({ action, err: error }, 'Action threw before Payload initialized');

    return;
  }

  payload.logger.error({ action, err: error }, 'Action threw');
}

/**
 * Revalidates what a successful write invalidated. A failing revalidation is
 * logged and swallowed: the row is already written, so answering with a failure
 * would show the User an outcome the database disagrees with.
 */
function revalidateWritten(paths: readonly string[], payload: Payload, action: string): void {
  for (const path of paths) {
    try {
      revalidatePath(path, 'page');
    } catch (error) {
      payload.logger.error({ action, path, err: error }, 'Revalidation failed after a write');
    }
  }
}

/**
 * The pipeline every action runs: resolve the caller, parse, authorize, handle,
 * revalidate — and turn anything thrown along the way into the failure member.
 *
 * Bringing up the Payload client is inside the `try` as well, so a database that
 * will not connect answers with `UNEXPECTED` rather than rejecting the promise a
 * client component is awaiting.
 */
async function execute<TSchema extends z.ZodType, TData, TUser extends User | null>(
  definition: ActionDefinition<TSchema, TData, TUser>,
  input: unknown,
  resolveUser: () => Promise<TUser>,
): Promise<ActionResult<TData>> {
  const startedAt = performance.now();
  let payload: Payload | undefined;

  try {
    payload = await getPayloadClient();

    const user = await resolveUser();
    const parsed = definition.schema.safeParse(input);

    if (!parsed.success) {
      return actionFailure(ACTION_ERROR.INVALID_INPUT, toFieldErrors(parsed.error));
    }

    const context: ActionContext<z.output<TSchema>, TUser> = {
      input: parsed.data,
      user,
      payload,
    };

    if (definition.authorize !== undefined && !(await definition.authorize(context))) {
      return actionFailure(ACTION_ERROR.FORBIDDEN);
    }

    const data = await definition.handler(context);

    revalidateWritten(definition.revalidatePaths ?? [], payload, definition.name);

    return actionSuccess(data);
  } catch (error) {
    // `redirect` and `notFound` work by throwing a sentinel Next has to see. Caught
    // and answered as a failure, the navigation never happens and a committed write
    // reads to the User as one to retry.
    unstable_rethrow(error);

    if (isActionError(error)) {
      return actionFailure(error.code, error.fields);
    }

    // A constraint refusing the write is an answer, not a defect. A create guards a
    // repeated client-minted id itself (ADR-0010); this is the net under the race
    // between that check and the insert, and under every other unique index.
    if (isUniqueViolation(error)) {
      return actionFailure(ACTION_ERROR.CONFLICT);
    }

    // A defect, not a refusal: the caller gets an opaque code and the detail stays here.
    logDefect(payload, definition.name, error);

    return actionFailure(ACTION_ERROR.UNEXPECTED);
  } finally {
    payload?.logger.debug(
      { action: definition.name, durationMs: Math.round(performance.now() - startedAt) },
      'Action settled',
    );
  }
}

/**
 * Builds an action any caller may reach, Guest included — sign-up, a public search.
 * The handler decides what a `null` user may do.
 *
 * The returned function is what a `"use server"` file exports, and it is the only
 * export it may have.
 */
function createAction<TSchema extends z.ZodType, TData>(
  definition: ActionDefinition<TSchema, TData, User | null>,
): Action<TSchema, TData> {
  return (input) => execute(definition, input, getSessionUser);
}

/**
 * Builds an action that needs a session. A Guest gets `UNAUTHENTICATED` before the
 * schema is read, so the handler's `user` is a `User` and never a branch.
 *
 * The returned function is what a `"use server"` file exports, and it is the only
 * export it may have.
 */
function createProtectedAction<TSchema extends z.ZodType, TData>(
  definition: ActionDefinition<TSchema, TData, User>,
): Action<TSchema, TData> {
  return (input) => execute(definition, input, requireSessionUser);
}

export type { Action, ActionContext, ActionDefinition };
export { createAction, createProtectedAction };
