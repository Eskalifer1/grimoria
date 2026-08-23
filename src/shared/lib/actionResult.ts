import { ACTION_STATUS, type ActionErrorCode } from '@/constants/action';

/** Schema messages per field path, as `safeParse` reports them. `null` when the failure is not a validation one. */
type ActionFieldErrors = Record<string, readonly string[]>;

/**
 * Why a call failed, in the shape every surface renders from: a `code` to branch
 * on and look copy up by, and `fields` for a form to attach messages to inputs.
 */
interface ActionFailureDetail<TCode extends string = ActionErrorCode> {
  code: TCode;
  fields: ActionFieldErrors | null;
}

/** A settled call that did what it was asked. `error` is present and `null`, so a caller may read it before narrowing. */
interface ActionSuccess<TData> {
  status: typeof ACTION_STATUS.SUCCESS;
  data: TData;
  error: null;
}

/** A settled call that refused or broke. `data` is present and `null`, so a caller may read it before narrowing. */
interface ActionFailure<TCode extends string = ActionErrorCode> {
  status: typeof ACTION_STATUS.FAILURE;
  data: null;
  error: ActionFailureDetail<TCode>;
}

/**
 * What every server call resolves to, in place of throwing across the client
 * boundary: a union on `status`, so a success carrying an error — or a failure
 * carrying data — cannot be written down. Both members declare both fields, so
 * reading `result.data` compiles before the narrowing and is `null` when the
 * call failed.
 *
 * See docs/features/data-access.md.
 */
type ActionResult<TData, TCode extends string = ActionErrorCode> =
  | ActionSuccess<TData>
  | ActionFailure<TCode>;

/** Builds the success member. The only place `status: 'success'` is written. */
function actionSuccess<TData>(data: TData): ActionSuccess<TData> {
  return { status: ACTION_STATUS.SUCCESS, data, error: null };
}

/**
 * Builds the failure member.
 *
 * @param fields schema messages per field, for a form to place beside its inputs
 */
function actionFailure<TCode extends string = ActionErrorCode>(
  code: TCode,
  fields: ActionFieldErrors | null = null,
): ActionFailure<TCode> {
  return { status: ACTION_STATUS.FAILURE, data: null, error: { code, fields } };
}

/** Narrows a result to its success member, for call sites that read `data` rather than `switch` on `status`. */
function isActionSuccess<TData, TCode extends string>(
  result: ActionResult<TData, TCode>,
): result is ActionSuccess<TData> {
  return result.status === ACTION_STATUS.SUCCESS;
}

export type { ActionFailure, ActionFailureDetail, ActionFieldErrors, ActionResult, ActionSuccess };
export { actionFailure, actionSuccess, isActionSuccess };
