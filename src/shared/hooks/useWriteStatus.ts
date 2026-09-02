'use client';

import { createContext, useContext } from 'react';

import { type FormStatus, IDLE_FORM_STATUS } from '@/shared/lib/formStatus';

/**
 * What the server has said about the write this form runs. Published by
 * `Form.Root`, defaulted to idle so a form outside any write still renders.
 */
const WriteStatusContext = createContext<FormStatus>(IDLE_FORM_STATUS);

/**
 * The write half of a form. What the User typed comes from `useFormContext()`
 * instead — one rule decides which of the two a component reads.
 *
 * Not `useFormStatus`, which is `react-dom`'s name.
 */
function useWriteStatus(): FormStatus {
  return useContext(WriteStatusContext);
}

export { useWriteStatus, WriteStatusContext };
