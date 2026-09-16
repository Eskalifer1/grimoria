'use client';

import type { ComponentProps, ReactNode } from 'react';

import { ModalAction } from '@/shared/components/ModalAction';
import { ModalBody } from '@/shared/components/ModalBody';
import { ModalFooter } from '@/shared/components/ModalFooter';
import { ModalFrame } from '@/shared/components/ModalFrame';
import { ModalHeader } from '@/shared/components/ModalHeader';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useReturnToOpener } from '@/shared/hooks/useReturnToOpener';
import { cn } from '@/shared/lib/cn';
import { type ModalSize, modalPanelClass } from '@/shared/lib/modalPanel';

interface ModalProps {
  /** Whether the modal is shown. Controlled: the page owns the flag. */
  open: boolean;

  /** Called with `false` on Escape, a click past the panel or `Modal.Close`; the page decides what happens. */
  onOpenChange: (open: boolean) => void;

  /** The panel's width from `sm` up. Below it every size fills the viewport minus the gutter. */
  size?: ModalSize;

  /** The content to render inside the panel — the parts, in the order they read. */
  children: ReactNode;

  /** Additional classes, merged onto the panel. */
  className?: string;
}

interface ModalTitleProps {
  /** The content to render inside the title. Required: it is what names the dialog. */
  children: ReactNode;

  /** Keeps the title out of the drawn panel and leaves it as the accessible name. */
  isSrOnly?: boolean;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

interface ModalDescriptionProps {
  /** The content to render inside the description. Present, it becomes the dialog's accessible description. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

type ModalCloseProps = Omit<ComponentProps<typeof Button>, 'variant' | 'type'>;

/**
 * A modal the User may leave at will — Escape and a click past it both close.
 * Controlled only; a page that needs a trigger renders its own button and flips
 * `open`. The registry's own close button is left out: its label is hardcoded
 * English, so a page composes `Modal.Close` with a label of its own.
 */
function ModalRoot({ open, onOpenChange, size = 'md', children, className }: ModalProps) {
  const returnToOpener = useReturnToOpener();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={modalPanelClass(size, className)}
        showCloseButton={false}
        {...returnToOpener}
      >
        <ModalFrame />
        {children}
      </DialogContent>
    </Dialog>
  );
}

function ModalTitle({ children, isSrOnly, className }: ModalTitleProps) {
  return (
    <DialogTitle className={cn('text-balance', isSrOnly && 'sr-only', className)}>
      {children}
    </DialogTitle>
  );
}

function ModalDescription({ children, className }: ModalDescriptionProps) {
  return <DialogDescription className={className}>{children}</DialogDescription>;
}

/** The control that leaves the modal, in the quiet outline so the action beside it reads first. */
function ModalClose(props: ModalCloseProps) {
  return (
    <DialogClose asChild>
      <Button type="button" variant="outline" {...props} />
    </DialogClose>
  );
}

const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
  Action: ModalAction,
});

export type { ModalCloseProps, ModalDescriptionProps, ModalProps, ModalTitleProps };
export { Modal };
