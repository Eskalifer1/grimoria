'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { ACTION_ERROR } from '@/constants/action';
import { VALIDATION_ERROR } from '@/constants/validation';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DestructiveButton } from '@/shared/components/DestructiveButton';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/ui/button';
import { useActionForm } from '@/shared/hooks/form/useActionForm';
import { actionFailure } from '@/shared/lib/actionResult';
import type { ModalSize } from '@/shared/lib/modalPanel';
import { validationMessage } from '@/shared/lib/validationMessage';

const noteSchema = z.object({
  note: z.string().trim().min(1, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

/** Always refuses, with no field named, so `Form.Error` renders a footer failure. */
async function writeNote() {
  return actionFailure(ACTION_ERROR.CONFLICT);
}

/** Mounted inside its modal, so closing discards the draft along with the panel. */
function NoteForm() {
  const t = useTranslations('modalPlayground');
  const { Form, ...binding } = useActionForm({
    schema: noteSchema,
    values: { note: '' },
    write: writeNote,
  });

  return (
    <Form.Root {...binding}>
      <Modal.Header>
        <Modal.Title>{t('formTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Input label={t('formLabel')} name="note" required />
        <Form.Error />
      </Modal.Body>
      <Modal.Footer>
        <Form.Actions>
          <Form.Submit />
        </Form.Actions>
      </Modal.Footer>
    </Form.Root>
  );
}

/**
 * A dev-only surface so every modal variant is reachable and checkable in both
 * Themes. Removed once that check is done — not a feature (#116).
 */
function ModalPlayground() {
  const t = useTranslations('modalPlayground');

  // `size` outlives `isSizeOpen` so the panel keeps its width through the close animation.
  const [size, setSize] = useState<ModalSize>('md');
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSrOnlyOpen, setIsSrOnlyOpen] = useState(false);
  const [isConfirmDefaultOpen, setIsConfirmDefaultOpen] = useState(false);
  const [isConfirmDestructiveOpen, setIsConfirmDestructiveOpen] = useState(false);

  function openSize(next: ModalSize) {
    setSize(next);
    setIsSizeOpen(true);
  }

  return (
    <section className="mt-6 flex flex-wrap gap-2">
      <Button onClick={() => openSize('sm')}>{t('openSmall')}</Button>
      <Button onClick={() => openSize('md')}>{t('openMedium')}</Button>
      <Button onClick={() => openSize('lg')}>{t('openLarge')}</Button>
      <Button onClick={() => setIsFormOpen(true)}>{t('openForm')}</Button>
      <Button onClick={() => setIsInfoOpen(true)}>{t('openInfo')}</Button>
      <Button onClick={() => setIsSrOnlyOpen(true)}>{t('openSrOnly')}</Button>
      <Button onClick={() => setIsConfirmDefaultOpen(true)}>{t('openConfirmDefault')}</Button>
      <Button onClick={() => setIsConfirmDestructiveOpen(true)}>
        {t('openConfirmDestructive')}
      </Button>
      <DestructiveButton
        confirm={{
          title: t('destructiveTitle'),
          description: t('destructiveDescription'),
          confirmLabel: t('deleteLabel'),
        }}
        onClick={() => {}}
      >
        {t('openDestructive')}
      </DestructiveButton>

      <Modal onOpenChange={setIsSizeOpen} open={isSizeOpen} size={size}>
        <Modal.Header>
          <Modal.Title>{t('sizeTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('sizeBody')}</Modal.Body>
        <Modal.Footer>
          <Modal.Close>{t('closeLabel')}</Modal.Close>
        </Modal.Footer>
      </Modal>

      <Modal onOpenChange={setIsFormOpen} open={isFormOpen}>
        <NoteForm />
      </Modal>

      <Modal onOpenChange={setIsInfoOpen} open={isInfoOpen}>
        <Modal.Header>
          <Modal.Title>{t('infoTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('infoBody')}</Modal.Body>
        <Modal.Footer>
          <Modal.Close>{t('closeLabel')}</Modal.Close>
        </Modal.Footer>
      </Modal>

      <Modal onOpenChange={setIsSrOnlyOpen} open={isSrOnlyOpen}>
        <Modal.Header>
          <Modal.Title isSrOnly>{t('srOnlyTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('srOnlyBody')}</Modal.Body>
        <Modal.Footer>
          <Modal.Close>{t('closeLabel')}</Modal.Close>
        </Modal.Footer>
      </Modal>

      <ConfirmDialog
        description={t('confirmDefaultDescription')}
        onConfirm={() => {}}
        onOpenChange={setIsConfirmDefaultOpen}
        open={isConfirmDefaultOpen}
        title={t('confirmDefaultTitle')}
      />

      <ConfirmDialog
        confirmLabel={t('deleteLabel')}
        description={t('confirmDestructiveDescription')}
        onConfirm={() => {}}
        onOpenChange={setIsConfirmDestructiveOpen}
        open={isConfirmDestructiveOpen}
        title={t('confirmDestructiveTitle')}
        tone="destructive"
      />
    </section>
  );
}

export { ModalPlayground };
