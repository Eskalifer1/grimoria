'use client';

import type { ComponentProps, ReactNode } from 'react';

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { ModalAction, type ModalActionProps } from '@/shared/components/ModalAction';
import { ModalBody } from '@/shared/components/ModalBody';
import { ModalFooter } from '@/shared/components/ModalFooter';
import { ModalHeader } from '@/shared/components/ModalHeader';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { useReturnToOpener } from '@/shared/hooks/useReturnToOpener';
import { cn } from '@/shared/lib/cn';
import { type ModalSize, modalPanelClass } from '@/shared/lib/modalPanel';

interface AlertModalProps {
  /** Whether the alert is shown. Controlled: the page owns the flag. */
  open: boolean;

  /** Called with `false` on Escape, `AlertModal.Cancel` or `AlertModal.Action`; a click past the panel does nothing. */
  onOpenChange: (open: boolean) => void;

  /** The panel's width from `sm` up. Below it every size fills the viewport minus the gutter. */
  size?: ModalSize;

  /** The content to render inside the panel — the parts, in the order they read. */
  children: ReactNode;

  /** Additional classes, merged onto the panel. */
  className?: string;
}

interface AlertModalTitleProps {
  /** The content to render inside the title. Required: it is what names the alert. */
  children: ReactNode;

  /** Keeps the title out of the drawn panel and leaves it as the accessible name. */
  isSrOnly?: boolean;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

interface AlertModalDescriptionProps {
  /** The content to render inside the description. Present, it becomes the alert's accessible description. */
  children: ReactNode;

  /** Additional classes, merged onto the root element. */
  className?: string;
}

type AlertModalCancelProps = Omit<
  ComponentProps<typeof AlertDialogCancel>,
  'variant' | 'size' | 'asChild'
>;

/**
 * An alert the User has to answer: a click past it does nothing, Escape counts
 * as cancel, and focus opens on the cancel control. Controlled only; a page
 * that needs a trigger renders its own button and flips `open`.
 */
function AlertModalRoot({ open, onOpenChange, size = 'md', children, className }: AlertModalProps) {
  const returnToOpener = useReturnToOpener();

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      {/* An unmatched `data-size` switches off the registry's own width variants. */}
      <AlertDialogContent
        className={modalPanelClass(size, className)}
        data-size="modal"
        {...returnToOpener}
      >
        {children}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertModalTitle({ children, isSrOnly, className }: AlertModalTitleProps) {
  return (
    <AlertDialogTitle className={cn('text-balance', isSrOnly && 'sr-only', className)}>
      {children}
    </AlertDialogTitle>
  );
}

function AlertModalDescription({ children, className }: AlertModalDescriptionProps) {
  return <AlertDialogDescription className={className}>{children}</AlertDialogDescription>;
}

/** The control that answers no. Also where focus opens, so a held Enter cannot confirm by accident. */
function AlertModalCancel(props: AlertModalCancelProps) {
  return <AlertDialogCancel {...props} />;
}

/**
 * The control that answers yes. Closes the alert on click unless `onClick`
 * prevents the default — a confirm that runs a write and must stay open on
 * failure does that. Built on the primitive rather than the registry's `Action`,
 * whose button classes would land after the destructive pair and override it.
 */
function AlertModalAction({ onClick, ...props }: ModalActionProps) {
  return (
    <AlertDialogPrimitive.Action asChild onClick={onClick}>
      <ModalAction {...props} />
    </AlertDialogPrimitive.Action>
  );
}

const AlertModal = Object.assign(AlertModalRoot, {
  Header: ModalHeader,
  Title: AlertModalTitle,
  Description: AlertModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Cancel: AlertModalCancel,
  Action: AlertModalAction,
});

export type {
  AlertModalCancelProps,
  AlertModalDescriptionProps,
  AlertModalProps,
  AlertModalTitleProps,
};
export { AlertModal };
