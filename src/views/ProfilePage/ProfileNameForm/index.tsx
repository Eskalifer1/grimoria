'use client';

import { useTranslations } from 'next-intl';

import { updateNameSchema } from '@/api/user/updateName/contract';
import { updateNameOptimistic } from '@/api/user/updateName/optimistic';
import { USER_NAME_MAX_LENGTH } from '@/constants/user';
import { Form } from '@/shared/components/Form';
import { Input } from '@/shared/components/ui/input';
import { useOptimisticForm } from '@/shared/hooks/form/useOptimisticForm';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';
import { optimisticFormStatus } from '@/shared/lib/formStatus';

interface ProfileNameFormProps {
  /** The User being renamed. The key the write is addressed by is built from it. */
  id: string;

  /** The name the server last confirmed. */
  name: string;

  /** That name's `updatedAt`, which is what lets the overlay die once a render catches up. */
  updatedAt: string;
}

/**
 * The reference surface for pattern B and for the form layer: the value changes
 * on the keystroke that submits it, nothing is disabled while the write is out,
 * and a failure survives a reload with the typed name still on screen
 * (`docs/features/data-access/pattern-b.md`, `docs/features/forms.md`).
 */
function ProfileNameForm({ id, name, updatedAt }: ProfileNameFormProps) {
  const t = useTranslations('profilePage');

  const displayName = useOptimisticValue({
    descriptor: updateNameOptimistic,
    input: { id, name },
    field: 'name',
    value: name,
    version: updatedAt,
  });

  const nameForm = useOptimisticForm({
    schema: updateNameSchema,
    values: { name: displayName.value },
    writeStatus: optimisticFormStatus('name', displayName),
    write: (values) => displayName.run(values.name),
  });

  return (
    <Form.Root {...nameForm}>
      <p className="font-ui text-text-title">{displayName.value}</p>
      <Form.Field
        // Screen-reader only: `maxLength` truncates without a word, so the bound
        // has to be stated before typing (3.3.2) — but a rule spelled out under
        // every field is noise on screen, and the `*` already says required.
        description={t('nameHint', { limit: USER_NAME_MAX_LENGTH })}
        isDescriptionHidden
        label={<span className="font-ui text-text-muted">{t('nameLabel')}</span>}
        name="name"
        required
        render={({ field }) => (
          <Input
            {...field}
            aria-busy={displayName.isPending}
            // The name the User chose to be seen as, which is not their own —
            // `name` would offer to autofill the one on their bank card.
            autoComplete="nickname"
            className="font-ui"
            maxLength={USER_NAME_MAX_LENGTH}
          />
        )}
      />
      <Form.Footer />
    </Form.Root>
  );
}

export type { ProfileNameFormProps };
export { ProfileNameForm };
