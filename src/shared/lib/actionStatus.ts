import { ACTION_STATUS, type ActionStatus } from '@/constants/action';

/** Nothing has been sent against this subject yet. */
function isIdle(status: ActionStatus): boolean {
  return status === ACTION_STATUS.IDLE;
}

/** A write is out and no answer has landed. */
function isPending(status: ActionStatus): boolean {
  return status === ACTION_STATUS.PENDING;
}

/** The last write landed. */
function isSuccess(status: ActionStatus): boolean {
  return status === ACTION_STATUS.SUCCESS;
}

/** The last write refused or broke. */
function isFailure(status: ActionStatus): boolean {
  return status === ACTION_STATUS.FAILURE;
}

export { isFailure, isIdle, isPending, isSuccess };
