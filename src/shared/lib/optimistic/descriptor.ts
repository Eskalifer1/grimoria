import type { PendingAction } from '@/constants/optimistic';
import type { ActionResult } from '@/shared/lib/actionResult';
import type { OptimisticPatch } from '@/shared/lib/optimistic/entry';

/** A Server Action as a descriptor sees it: one input, one `ActionResult`. */
type OptimisticAction<TInput, TData> = (input: TInput) => Promise<ActionResult<TData>>;

/**
 * The two things about an optimistic write that only its action knows: which key
 * it addresses, and where in the answer the value lives. Declared once beside the
 * action, so two screens calling it cannot disagree about the key.
 *
 * See docs/features/data-access/optimistic-hooks.md.
 */
interface OptimisticDescriptor<TInput, TData> {
  /** The action itself, so a call site hands over an input and never a key. */
  run: OptimisticAction<TInput, TData>;

  /** Which kind of write this is — what a row renders its flight and failure state from. */
  pending: PendingAction;

  /** The key this write addresses, built from the action's own input. */
  key: (input: TInput) => string;

  /** Where in the server's answer the value lives. Absent when there is nothing to overlay. */
  value?: (data: TData) => OptimisticPatch;

  /** The `updatedAt` the answer carries, which dates the entry against later renders. */
  version?: (data: TData) => string | null;
}

/**
 * Declares a descriptor with its action's input and result inferred, so `key` and
 * `value` are checked against that action rather than against `unknown`.
 */
function optimisticDescriptor<TInput, TData>(
  descriptor: OptimisticDescriptor<TInput, TData>,
): OptimisticDescriptor<TInput, TData> {
  return descriptor;
}

/**
 * Whether a stored value is the shape of the server value it stands in for.
 *
 * `null` on either side passes. An empty nullable field renders as `null`, and
 * clearing one optimistically stores `null` — measured by `typeof` both read as
 * `'object'`, and every overlay on a nullable field would be dropped in silence:
 * the User types, saves, and the value never changes on screen.
 */
function isSameShape(stored: unknown, fallback: unknown): boolean {
  if (stored === null || fallback === null) {
    return true;
  }

  if (typeof stored !== typeof fallback) {
    return false;
  }

  // `typeof` answers `'object'` for a list and for a record alike, so a document
  // written by an older build could otherwise hand a component a shape it has no
  // way to render. A structural check is not possible here; this is the half of
  // one that is.
  return Array.isArray(stored) === Array.isArray(fallback);
}

/**
 * One field off a patch, as the type the server value it stands in for has.
 *
 * The store is keyed by strings and holds `unknown` on purpose — it outlives the
 * shape it was written under, and a persisted document may come from an older
 * build. Matching the server value's own shape is the check that makes the
 * narrowing true instead of assumed; anything else falls back rather than
 * rendering a number where a string belongs.
 */
function patchField<TValue>(
  patch: OptimisticPatch | undefined,
  field: string,
  fallback: TValue,
): TValue {
  const stored = patch?.[field];

  // No overlay on this field, which is not the same thing as an overlay that
  // stored nothing — that one is a value, and it is the one being asked for.
  if (stored === undefined) {
    return fallback;
  }

  return isSameShape(stored, fallback) ? (stored as TValue) : fallback;
}

/** Every field of a patch overlaid on the server's values, keeping their type. */
function patchValues<TValues extends object>(
  values: TValues,
  patch: OptimisticPatch | undefined,
): TValues {
  const overlaid = Object.entries(values).map(([field, fallback]: [string, unknown]) => [
    field,
    patchField(patch, field, fallback),
  ]);

  return { ...values, ...Object.fromEntries(overlaid) };
}

export type { OptimisticAction, OptimisticDescriptor };
export { optimisticDescriptor, patchField, patchValues };
