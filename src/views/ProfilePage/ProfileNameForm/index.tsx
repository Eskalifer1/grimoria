'use client';

import { type FormEvent, useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import { updateName } from '@/api/user/updateName';
import { ACTION_ERROR, FAILURE_BEHAVIOR } from '@/constants/action';
import { USER_NAME_MAX_LENGTH } from '@/constants/user';
import { Button } from '@/shared/components/ui/button';
import { useActionErrorMessage } from '@/shared/hooks/useActionErrorMessage';
import { useOptimisticAction } from '@/shared/hooks/useOptimisticAction';

interface ProfileNameFormProps {
  /** The name the server last confirmed — the value a failed save rolls back to. */
  name: string;
}

function ProfileNameForm({ name }: ProfileNameFormProps) {
  const t = useTranslations('profilePage');
  const toErrorMessage = useActionErrorMessage();
  const [draft, setDraft] = useState(name);
  const fieldId = useId();
  const errorId = useId();

  // Pattern B, edit semantics: a failure must not leave the User reading a name
  // the server never stored (docs/features/data-access.md).
  const { value, error, isPending, run, reset } = useOptimisticAction<string>({
    value: name,
    failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
  });

  const errorMessage = toErrorMessage(error);
  // Only a rejected input is the field's own fault; no session and no right are not.
  const isInputRejected = error?.code === ACTION_ERROR.INVALID_INPUT;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The draft stays as typed on a failure; only the confirmed name below rolls back.
    void run(draft, () => updateName({ name: draft }), { successValue: (data) => data.name });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p aria-live="polite" className="font-ui text-text-title">
        {value}
      </p>

      <label htmlFor={fieldId} className="font-ui text-text-muted">
        {t('nameLabel')}
      </label>
      <input
        id={fieldId}
        value={draft}
        maxLength={USER_NAME_MAX_LENGTH}
        aria-invalid={isInputRejected}
        aria-describedby={errorMessage === null ? undefined : errorId}
        onChange={(event) => setDraft(event.target.value)}
        className="rounded-md border border-border-subtle bg-surface-inset p-2 font-ui text-text-body"
      />

      {errorMessage === null ? null : (
        <div id={errorId} role="alert" className="flex items-center gap-2 font-ui text-text-accent">
          {errorMessage}
          <Button type="button" variant="ghost" size="xs" onClick={reset}>
            {t('dismiss')}
          </Button>
        </div>
      )}

      <Button type="submit" disabled={isPending} aria-busy={isPending} className="self-start">
        {t('save')}
      </Button>
    </form>
  );
}

export { ProfileNameForm };
