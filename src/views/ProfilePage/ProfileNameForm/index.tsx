'use client';

import { useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { updateNameSchema } from '@/api/user/updateName/contract';
import { updateNameOptimistic } from '@/api/user/updateName/optimistic';
import { USER_NAME_MAX_LENGTH } from '@/constants/user';
import {
  Form,
  FormControl,
  FormField,
  FormFieldMessage,
  FormItem,
  FormLabel,
} from '@/shared/components/Form';
import { Input } from '@/shared/components/ui/input';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';

interface ProfileNameFormProps {
  /** The User being renamed. The key the write is addressed by is built from it. */
  id: string;

  /** The name the server last confirmed. */
  name: string;

  /** That name's `updatedAt`, which is what lets the overlay die once a render catches up. */
  updatedAt: string;
}

/**
 * The reference surface for pattern B: the value changes on the keystroke that
 * submits it, nothing is disabled while the write is out, and a failure survives
 * a reload with the typed name still on screen
 * (`docs/features/data-access/pattern-b.md`).
 */
function ProfileNameForm({ id, name, updatedAt }: ProfileNameFormProps) {
  const t = useTranslations('profilePage');
  const nameInput = useRef<HTMLInputElement>(null);

  const displayName = useOptimisticValue({
    descriptor: updateNameOptimistic,
    input: { id, name },
    field: 'name',
    value: name,
    version: updatedAt,
  });

  const form = useForm({
    resolver: zodResolver(updateNameSchema),
    // `values`, not `defaultValues`: the latter is read once, so a name the server
    // normalized — or an attempt thrown away — would move the text and leave the
    // input behind, and the next save would revert it.
    values: { name: displayName.value },
    // Without this, the answer to one save resets the field and whatever was
    // typed while that save was in flight is gone.
    resetOptions: { keepDirtyValues: true },
  });

  // A failure naming the field is about the value and belongs beside the input;
  // no session and no right are about the write, and belong to the form.
  const beside = displayName.fieldError;

  /**
   * The server may store a name it normalized, and `values` only carries that
   * back into a field react-hook-form does not consider dirty. If the User typed
   * again while the write was out, the field is newer than the answer and keeps it.
   */
  async function save(next: string) {
    await displayName.run(next);

    if (form.getValues('name') === next) {
      form.resetField('name');
    }
  }

  return (
    <Form
      error={beside ? null : displayName.error}
      form={form}
      isPending={displayName.isPending}
      onDismiss={displayName.dismiss}
      onSubmit={(values) => void save(values.name)}
      returnFocusTo={nameInput}
      submitLabel={t('save')}
    >
      <p className="font-ui text-text-title">{displayName.value}</p>

      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-ui text-text-muted">{t('nameLabel')}</FormLabel>
            <FormControl error={beside}>
              <Input
                {...field}
                aria-busy={displayName.isPending}
                className="font-ui"
                maxLength={USER_NAME_MAX_LENGTH}
                ref={(node) => {
                  field.ref(node);
                  nameInput.current = node;
                }}
              />
            </FormControl>
            <FormFieldMessage error={beside} />
          </FormItem>
        )}
      />
    </Form>
  );
}

export type { ProfileNameFormProps };
export { ProfileNameForm };
